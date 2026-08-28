import { supabase } from './supabaseClient';

const BUCKET_PORTADAS = 'articulos_publicos';

/**
 * Convierte un título en un slug apto para URL.
 * Quita acentos, signos y espacios: "Impacto de las NIF" -> "impacto-de-las-nif".
 * @param {string} texto
 * @returns {string}
 */
export const generarSlug = (texto = '') =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas de acento que deja NFD
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

/**
 * Lista todos los artículos, publicados y borradores. Solo para el panel:
 * las políticas RLS impiden que un anónimo vea los borradores.
 * @returns {Promise<Array>}
 */
export const obtenerArticulos = async () => {
  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .order('actualizado_en', { ascending: false });

  if (error) {
    console.error('Error al obtener los artículos:', error);
    throw error;
  }
  return data;
};

/**
 * Obtiene un artículo por su id.
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const obtenerArticulo = async (id) => {
  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener el artículo:', error);
    throw error;
  }
  return data;
};

/**
 * Crea un artículo en estado borrador.
 * @param {string} titulo
 * @returns {Promise<Object>} El artículo creado.
 */
export const crearArticulo = async (titulo) => {
  if (!titulo?.trim()) {
    throw new Error('El título es obligatorio.');
  }

  const slug = generarSlug(titulo);
  if (!slug) {
    throw new Error('El título no produce una dirección válida. Usa al menos una letra o número.');
  }

  const { data, error } = await supabase
    .from('articulos')
    .insert({ titulo: titulo.trim(), slug })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un artículo con esa dirección. Cambia el título.');
    }
    console.error('Error al crear el artículo:', error);
    throw error;
  }
  return data;
};

/**
 * Guarda los cambios de un artículo.
 * @param {number} id
 * @param {Object} campos - titulo, resumen, contenido_html, portada_url, autor, slug.
 * @returns {Promise<Object>}
 */
export const guardarArticulo = async (id, campos) => {
  const { data, error } = await supabase
    .from('articulos')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe otro artículo con esa dirección.');
    }
    console.error('Error al guardar el artículo:', error);
    throw error;
  }
  return data;
};

/**
 * Publica o despublica un artículo. Al publicar por primera vez fija la fecha
 * de publicación; despublicar no la borra, para no perder la fecha original.
 * @param {number} id
 * @param {boolean} publicar
 * @param {string|null} fechaExistente
 * @returns {Promise<Object>}
 */
export const cambiarPublicacion = async (id, publicar, fechaExistente = null) => {
  const campos = { publicado: publicar };
  if (publicar && !fechaExistente) {
    campos.fecha_publicacion = new Date().toISOString();
  }
  return guardarArticulo(id, campos);
};

/**
 * Sube la portada al bucket público y devuelve su URL definitiva.
 * @param {string} slug - Se usa como carpeta, para que cada artículo tenga la suya.
 * @param {File} archivo
 * @returns {Promise<string>} URL pública de la imagen.
 */
export const subirPortada = async (slug, archivo) => {
  if (!slug || !archivo) {
    throw new Error('Faltan el artículo o el archivo para subir la portada.');
  }

  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';
  const ruta = `${slug}/portada.${extension}`;

  const { error: errorSubida } = await supabase.storage
    .from(BUCKET_PORTADAS)
    .upload(ruta, archivo, { upsert: true, cacheControl: '3600' });

  if (errorSubida) {
    console.error('Error al subir la portada:', errorSubida);
    throw errorSubida;
  }

  const { data } = supabase.storage.from(BUCKET_PORTADAS).getPublicUrl(ruta);
  return data.publicUrl;
};

/**
 * Elimina un artículo y, si tenía portada, también su carpeta en Storage.
 * @param {Object} articulo
 */
export const eliminarArticulo = async (articulo) => {
  const { error } = await supabase.from('articulos').delete().eq('id', articulo.id);

  if (error) {
    console.error('Error al eliminar el artículo:', error);
    throw error;
  }

  // La imagen se borra después: si fallara, quedaría un archivo huérfano en
  // Storage, que es preferible a borrar la imagen de un artículo que sigue vivo.
  if (articulo.portada_url) {
    const { data: archivos } = await supabase.storage
      .from(BUCKET_PORTADAS)
      .list(articulo.slug);

    if (archivos?.length) {
      await supabase.storage
        .from(BUCKET_PORTADAS)
        .remove(archivos.map((a) => `${articulo.slug}/${a.name}`));
    }
  }
};

/**
 * Pide a Supabase que dispare la reconstrucción del sitio.
 * El contenido se empaqueta en tiempo de compilación, así que publicar solo
 * surte efecto cuando el sitio se vuelve a desplegar.
 * @returns {Promise<boolean>} true si el despliegue se disparó.
 */
export const solicitarDespliegue = async () => {
  const { error } = await supabase.functions.invoke('publicar-articulo', { body: {} });

  if (error) {
    console.error('No se pudo disparar el despliegue:', error);
    return false;
  }
  return true;
};
