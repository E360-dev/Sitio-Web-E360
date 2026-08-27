import { supabase } from './supabaseClient';

/**
 * Obtiene todos los clientes desde la tabla `public.clientes`.
 * @returns {Promise<Array>} Lista de clientes con id, nombre y empresa.
 */
export const obtenerClientes = async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, empresa, user_id') // Añadido user_id
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
  return data;
};

/**
 * Crea un nuevo documento en estado 'borrador'.
 * @param {string} nombreDocumento - El nombre interno del documento.
 * @param {number} idClienteAsignado - El ID interno del cliente al que se le asigna.
 * @returns {Promise<Object>} El nuevo registro de documento creado.
 */
export const crearDocumentoBorrador = async (nombreDocumento, idClienteAsignado) => {
  if (!nombreDocumento || !idClienteAsignado) {
    throw new Error('El nombre del documento y el cliente son obligatorios.');
  }

  const { data, error } = await supabase
    .from('documentos')
    .insert({
      nombre_documento: nombreDocumento,
      id_cliente_asignado: idClienteAsignado,
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear el documento borrador:', error);
    throw error;
  }

  return data;
};

/**
 * Sube un archivo PDF al storage privado y asocia la ruta al registro del documento.
 * Incluye un rollback de Storage si falla la actualización de la base de datos.
 * @param {number} documentoId - El ID (bigint) del documento.
 * @param {string} documentoUuid - El UUID público del documento.
 * @param {File} archivo - El objeto del archivo a subir.
 * @returns {Promise<Object>} El registro del documento actualizado.
 */
export const subirPdfYAsociar = async (documentoId, documentoUuid, archivo, hashDocumento) => {
  if (!documentoId || !documentoUuid || !archivo || !hashDocumento) {
    throw new Error('Faltan parámetros requeridos (ID, UUID, archivo, hash) para subir el archivo.');
  }

  const rutaArchivo = `${documentoUuid}/documento.pdf`;

  // 1. Subir el archivo a Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documentos_privados')
    .upload(rutaArchivo, archivo, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error detallado de Supabase Storage:', uploadError);
    const errorMessage = `Storage Error: ${uploadError.message} (Status: ${uploadError.statusCode || 'N/A'})`;
    throw new Error(errorMessage);
  }

  // 2. Actualizar la tabla de documentos. Si esto falla, deshacer la subida.
  try {
    const { data, error: updateError } = await supabase
      .from('documentos')
      .update({ ruta_storage_pdf: rutaArchivo, hash_documento: hashDocumento })
      .eq('id', documentoId)
      .select()
      .single();
    
    if (updateError) throw updateError;

    return { success: true, ...data }; // Retornar éxito y los datos actualizados
  } catch (error) {
    // Si falla la actualización de la DB, se intenta eliminar el archivo huérfano.
    console.error('Error al actualizar la ruta del PDF. Iniciando rollback de Storage...', error);
    const { error: removeError } = await supabase.storage
      .from('documentos_privados')
      .remove([rutaArchivo]);
    
    if (removeError) {
      console.error('¡FALLO CRÍTICO! No se pudo eliminar el archivo huérfano:', removeError);
    }
    
    throw new Error(`Error al asociar el PDF con el documento: ${error.message || error.toString()}`);
  }
};

/**
 * Sube un PDF de reemplazo para un documento ya emitido sin publicarlo todavía.
 * @param {number} documentoId
 * @param {string} documentoUuid
 * @param {File} archivo
 * @param {string} hashDocumento
 * @param {string|null} rutaPendienteActual
 * @returns {Promise<Object>}
 */
export const subirPdfReemplazoPendiente = async (
  documentoId,
  documentoUuid,
  archivo,
  hashDocumento,
  rutaPendienteActual = null
) => {
  if (!documentoId || !documentoUuid || !archivo || !hashDocumento) {
    throw new Error('Faltan parámetros requeridos para subir el reemplazo pendiente.');
  }

  const rutaArchivoPendiente = `${documentoUuid}/pendiente-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('documentos_privados')
    .upload(rutaArchivoPendiente, archivo, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error detallado de Supabase Storage al subir reemplazo pendiente:', uploadError);
    const errorMessage = `Storage Error: ${uploadError.message} (Status: ${uploadError.statusCode || 'N/A'})`;
    throw new Error(errorMessage);
  }

  try {
    const { data, error: updateError } = await supabase
      .from('documentos')
      .update({
        ruta_storage_pdf_pendiente: rutaArchivoPendiente,
        hash_documento_pendiente: hashDocumento,
      })
      .eq('id', documentoId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (rutaPendienteActual && rutaPendienteActual !== rutaArchivoPendiente) {
      const { error: removeOldPendingError } = await supabase.storage
        .from('documentos_privados')
        .remove([rutaPendienteActual]);

      if (removeOldPendingError) {
        console.error('No se pudo eliminar el reemplazo pendiente anterior:', removeOldPendingError);
      }
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Error al actualizar el reemplazo pendiente. Iniciando rollback de Storage...', error);
    const { error: removeError } = await supabase.storage
      .from('documentos_privados')
      .remove([rutaArchivoPendiente]);

    if (removeError) {
      console.error('No se pudo eliminar el archivo pendiente huérfano:', removeError);
    }

    throw new Error(`Error al asociar el reemplazo pendiente: ${error.message || error.toString()}`);
  }
};

/**
 * Invoca la RPC para emitir un documento de forma definitiva.
 * @param {number} documentoId - El ID (bigint) del documento a emitir.
 * @param {string} hashDocumento - El hash SHA-256 del archivo PDF.
 * @returns {Promise<any>} El resultado de la llamada a la RPC.
 */
export const emitirDocumento = async (documentoId, hashDocumento) => {
  if (!documentoId || !hashDocumento) {
    throw new Error('El ID del documento y el hash son obligatorios para la emisión.');
  }

  const { data, error } = await supabase.rpc('emitir_documento', {
    p_documento_id: documentoId,
    p_hash_documento: hashDocumento,
  });

  if (error) {
    console.error('Error al invocar la RPC emitir_documento:', error);
    throw new Error(error.message || 'La emisión falló en el servidor.');
  }

  return { success: true, data }; // Retornar éxito y los datos de la RPC
};

/**
 * Obtiene los detalles de un único documento por su UUID.
 * @param {string} uuid - El UUID del documento.
 * @returns {Promise<Object>} Los detalles del documento.
 */
export const confirmarReemplazoDocumento = async (documento) => {
  if (!documento?.id || !documento?.ruta_storage_pdf_pendiente || !documento?.hash_documento_pendiente) {
    throw new Error('El documento no tiene un reemplazo pendiente listo para confirmar.');
  }

  const rutaAnterior = documento.ruta_storage_pdf;

  const { data, error } = await supabase
    .from('documentos')
    .update({
      ruta_storage_pdf: documento.ruta_storage_pdf_pendiente,
      hash_documento: documento.hash_documento_pendiente,
      ruta_storage_pdf_pendiente: null,
      hash_documento_pendiente: null,
    })
    .eq('id', documento.id)
    .select()
    .single();

  if (error) {
    console.error('Error al confirmar el reemplazo del documento:', error);
    throw new Error(error.message || 'No se pudo confirmar el reemplazo del documento.');
  }

  if (rutaAnterior && rutaAnterior !== data.ruta_storage_pdf) {
    const { error: removeError } = await supabase.storage
      .from('documentos_privados')
      .remove([rutaAnterior]);

    if (removeError) {
      console.error('No se pudo eliminar el PDF vigente anterior:', removeError);
    }
  }

  return { success: true, ...data };
};

export const cancelarReemplazoDocumento = async (documento) => {
  if (!documento?.id) {
    throw new Error('El documento es obligatorio para cancelar el reemplazo.');
  }

  const rutaPendiente = documento.ruta_storage_pdf_pendiente;

  const { data, error } = await supabase
    .from('documentos')
    .update({
      ruta_storage_pdf_pendiente: null,
      hash_documento_pendiente: null,
    })
    .eq('id', documento.id)
    .select()
    .single();

  if (error) {
    console.error('Error al cancelar el reemplazo del documento:', error);
    throw new Error(error.message || 'No se pudo cancelar el reemplazo del documento.');
  }

  if (rutaPendiente) {
    const { error: removeError } = await supabase.storage
      .from('documentos_privados')
      .remove([rutaPendiente]);

    if (removeError) {
      console.error('No se pudo eliminar el PDF pendiente cancelado:', removeError);
    }
  }

  return { success: true, ...data };
};

export const obtenerDocumentoPorUuid = async (uuid) => {
  if (!uuid) throw new Error('El UUID es obligatorio.');

  const { data, error } = await supabase
    .from('documentos')
    .select(`*, clientes(nombre, empresa)`) // Selecciona columnas del documento y del cliente relacionado
    .eq('uuid', uuid)
    .single();

  if (error) {
    console.error('Error al obtener los detalles del documento:', error);
    throw new Error('No se pudo encontrar el documento.');
  }
  return data;
};

/**
 * Obtiene el ID interno de la tabla `clientes` usando el `user_id` de Supabase (auth.uid()).
 * @param {string} supabaseUserId - El user_id de Supabase (auth.uid()).
 * @returns {Promise<number|null>} El id interno del cliente o null si no se encuentra.
 */
export const obtenerClienteIdPorUserId = async (supabaseUserId) => {
  if (!supabaseUserId) throw new Error('El ID de usuario de Supabase es obligatorio.');

  const { data, error } = await supabase
    .from('clientes')
    .select('id')
    .eq('user_id', supabaseUserId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 es 'No rows found'
    console.error('Error al obtener el ID del cliente por user_id:', error);
    throw new Error('No se pudo obtener el ID del cliente.');
  }

  return data ? data.id : null;
};

/**
 * Genera una URL firmada y de corta duración para un archivo en Storage privado.
 * @param {string} rutaArchivo - La ruta del archivo dentro del bucket.
 * @returns {Promise<string>} La URL temporal.
 */
export const generarUrlTemporalPdf = async (rutaArchivo) => {
  if (!rutaArchivo) throw new Error('La ruta del archivo es obligatoria.');

  const { data, error } = await supabase.storage
    .from('documentos_privados')
    .createSignedUrl(rutaArchivo, 60); // La URL expira en 60 segundos

  if (error) {
    console.error('Error al generar la URL firmada:', error);
    throw new Error('No se pudo obtener el enlace seguro para el PDF.');
  }
  return data.signedUrl;
};

/**
 * Obtiene todos los documentos emitidos para un cliente específico.
 * @param {number} idCliente - El ID interno (bigint) del cliente.
 * @returns {Promise<Array>} Lista de documentos emitidos.
 */
export const obtenerDocumentosPorCliente = async (idCliente) => {
  if (!idCliente) throw new Error('El ID del cliente es obligatorio.');

  const { data, error } = await supabase
    .from('documentos')
    .select('uuid, nombre_documento, fecha_emision, estado')
    .eq('id_cliente_asignado', idCliente)
    .eq('estado', 'emitido')
    .order('fecha_emision', { ascending: false });

  if (error) {
    console.error('Error al obtener documentos por cliente:', error);
    throw new Error('No se pudieron obtener los documentos del cliente.');
  }
  return data;
};

/**
 * Actualiza el nombre de un documento.
 * @param {number} documentoId - El ID del documento a actualizar.
 * @param {string} nuevoNombre - El nuevo nombre del documento.
 * @returns {Promise<Object>} El registro del documento actualizado.
 */
export const actualizarNombreDocumento = async (documentoId, nuevoNombre) => {
  if (!documentoId || !nuevoNombre) {
    throw new Error('El ID del documento y el nuevo nombre son obligatorios.');
  }

  const { data, error } = await supabase
    .from('documentos')
    .update({ nombre_documento: nuevoNombre })
    .eq('id', documentoId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar el nombre del documento:', error);
    throw error;
  }

  return { success: true, ...data };
};

/**
 * Actualiza la fecha de emisión de un documento.
 * @param {number} documentoId - El ID del documento a actualizar.
 * @param {string} nuevaFecha - La nueva fecha en formato YYYY-MM-DD.
 * @returns {Promise<Object>} El registro del documento actualizado.
 */
export const actualizarFechaEmision = async (documentoId, nuevaFecha) => {
  if (!documentoId || !nuevaFecha) {
    throw new Error('El ID del documento y la nueva fecha son obligatorios.');
  }

  const { data, error } = await supabase
    .from('documentos')
    .update({ fecha_emision: nuevaFecha })
    .eq('id', documentoId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar la fecha de emisión:', error);
    throw error;
  }

  return { success: true, ...data };
};

/**
 * Calcula el hash SHA-256 de un ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer - El ArrayBuffer del archivo.
 * @returns {Promise<string>} El hash SHA-256 en formato hexadecimal.
 */
export async function calcularHashSha256(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
