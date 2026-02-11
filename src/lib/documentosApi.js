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
 * @param {string} idClienteAsignado - El ID del cliente al que se le asigna.
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
export const obtenerDocumentoPorUuid = async (uuid) => {
  if (!uuid) throw new Error('El UUID es obligatorio.');

  const { data, error } = await supabase
    .from('documentos')
    .select(`*`) // Selecciona solo las columnas directas de 'documentos'
    .eq('uuid', uuid)
    .single();

  if (error) {
    console.error('Error al obtener los detalles del documento:', error);
    throw new Error('No se pudo encontrar el documento.');
  }
  return data;
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
 * @param {string} idCliente - El UUID del cliente.
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