import { supabase } from './supabaseClient';

// Radar comercial: prospectos, hitos, archivos y accesos.
//
// Los permisos reales están en Supabase (supabase/migrations/20261007_radar_comercial.sql).
// Los pasos se cierran con funciones que validan quién, en qué orden y con qué entregable.

const BUCKET = 'radar';

export const ESTADOS = {
  candidato: 'Candidato',
  no_elegido: 'No elegido',
  en_curso: 'En curso',
  enviado: 'Enviado',
  en_seguimiento: 'En seguimiento',
  descartado: 'Descartado',
};

/** Archivos que pide cada paso. */
export const TIPOS_ARCHIVO = {
  3: [
    { tipo: 'matriz_riesgos', nombre: 'Matriz de riesgos' },
    { tipo: 'guia_entendimiento', nombre: 'Guía de entendimiento' },
    { tipo: 'ficha_directivos', nombre: 'Ficha del CEO/CFO' },
    { tipo: 'decision_pack', nombre: 'Decision Pack' },
  ],
  5: [
    { tipo: 'nota_ejecutiva', nombre: 'Nota ejecutiva' },
    { tipo: 'plan_seguimiento', nombre: 'Plan de seguimiento' },
  ],
};

export const FORMATOS_ACEPTADOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg';

const fallar = (error, mensaje) => {
  console.error(mensaje, error);
  throw new Error(error?.message || mensaje);
};

/** Mi acceso al Radar: null si no estoy en la lista. */
export const obtenerMiAcceso = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('radar_accesos')
    .select('user_id, nombre, pasos')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) fallar(error, 'No se pudo comprobar el acceso al Radar.');
  return data;
};

export const obtenerAccesos = async () => {
  const { data, error } = await supabase
    .from('radar_accesos')
    .select('user_id, nombre, pasos')
    .order('nombre');
  if (error) fallar(error, 'No se pudo cargar la lista de accesos.');
  return data;
};

export const obtenerUsuariosInternos = async () => {
  const { data, error } = await supabase.rpc('radar_usuarios_internos');
  if (error) fallar(error, 'No se pudo cargar la lista de usuarios.');
  return data;
};

export const guardarAcceso = async ({ user_id, nombre, pasos }) => {
  const { error } = await supabase
    .from('radar_accesos')
    .upsert({ user_id, nombre, pasos }, { onConflict: 'user_id' });
  if (error) fallar(error, 'No se pudo guardar el acceso.');
};

export const quitarAcceso = async (userId) => {
  const { error } = await supabase.from('radar_accesos').delete().eq('user_id', userId);
  if (error) fallar(error, 'No se pudo quitar el acceso.');
};

export const obtenerPasos = async () => {
  const { data, error } = await supabase.from('radar_pasos').select('*').order('paso');
  if (error) fallar(error, 'No se pudo cargar el flujo.');
  return data;
};

/** Prospectos con sus hitos. */
export const obtenerProspectos = async () => {
  const { data, error } = await supabase
    .from('radar_prospectos')
    .select('*, radar_hitos(paso, fecha_compromiso, fecha_real)')
    .order('fecha_lista', { ascending: false })
    .order('score', { ascending: false, nullsFirst: false });
  if (error) fallar(error, 'No se pudieron cargar los prospectos.');
  return data;
};

export const obtenerProspecto = async (id) => {
  const { data, error } = await supabase
    .from('radar_prospectos')
    .select('*, radar_hitos(*), radar_archivos(*), radar_comentarios(*)')
    .eq('id', id)
    .single();
  if (error) fallar(error, 'No se pudo cargar el prospecto.');
  return data;
};

export const crearCandidato = async (candidato) => {
  const { error } = await supabase.from('radar_prospectos').insert({ ...candidato, estado: 'candidato' });
  if (error) fallar(error, 'No se pudo dar de alta el candidato.');
};

export const actualizarProspecto = async (id, cambios) => {
  const { error } = await supabase.from('radar_prospectos').update(cambios).eq('id', id);
  if (error) fallar(error, 'No se pudo guardar el cambio.');
};

export const eliminarCandidato = async (id) => {
  const { error } = await supabase.from('radar_prospectos').delete().eq('id', id);
  if (error) fallar(error, 'No se pudo eliminar el candidato.');
};

export const elegirProspecto = async (id) => {
  const { error } = await supabase.rpc('radar_elegir', { p_prospecto: id });
  if (error) fallar(error, 'No se pudo elegir el prospecto.');
};

export const completarPaso = async (id, paso, texto = null) => {
  const { error } = await supabase.rpc('radar_completar_paso', { p_prospecto: id, p_paso: paso, p_texto: texto });
  if (error) fallar(error, 'No se pudo cerrar el paso.');
};

export const registrarObservaciones = async (id, texto) => {
  const { error } = await supabase.rpc('radar_registrar_observaciones', { p_prospecto: id, p_texto: texto });
  if (error) fallar(error, 'No se pudieron registrar las observaciones.');
};

export const agregarComentario = async (prospectoId, paso, texto) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('radar_comentarios')
    .insert({ prospecto_id: prospectoId, paso, texto, autor: user.id });
  if (error) fallar(error, 'No se pudo guardar el comentario.');
};

export const moverFechaCompromiso = async (prospectoId, paso, fecha) => {
  const { error } = await supabase
    .from('radar_hitos')
    .update({ fecha_compromiso: fecha })
    .eq('prospecto_id', prospectoId)
    .eq('paso', paso);
  if (error) fallar(error, 'No se pudo mover la fecha.');
};

/**
 * Sube un archivo como versión nueva de su tipo. Nunca reemplaza: si falla el
 * registro en la tabla, borra el archivo subido para no dejar huérfanos.
 */
export const subirArchivo = async ({ prospectoId, paso, tipo, archivo, versionActual }) => {
  const { data: { user } } = await supabase.auth.getUser();
  const limpio = archivo.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_');
  const ruta = `${prospectoId}/${paso}/${Date.now()}_${limpio}`;

  const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(ruta, archivo);
  if (errorSubida) fallar(errorSubida, 'No se pudo subir el archivo.');

  const { error } = await supabase.from('radar_archivos').insert({
    prospecto_id: prospectoId,
    paso,
    tipo,
    nombre: archivo.name,
    ruta,
    version: versionActual + 1,
    subido_por: user.id,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([ruta]);
    fallar(error, 'No se pudo registrar el archivo.');
  }
};

/** Enlace de descarga que expira en 60 segundos. */
export const urlTemporal = async (ruta) => {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, 60);
  if (error) fallar(error, 'No se pudo generar el enlace de descarga.');
  return data.signedUrl;
};

// --- Utilidades de fechas y avance ---

const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** Primer hito sin cerrar (el paso en el que va el prospecto). */
export const pasoActual = (hitos = []) =>
  [...hitos].sort((a, b) => a.paso - b.paso).find((h) => !h.fecha_real) || null;

/** 'atrasado' | 'por_vencer' | 'a_tiempo' | 'hecho' */
export const semaforo = (hito) => {
  if (!hito) return 'hecho';
  if (hito.fecha_real) return hito.fecha_real > hito.fecha_compromiso ? 'hecho_tarde' : 'hecho';
  const hoy = hoyISO();
  if (hito.fecha_compromiso < hoy) return 'atrasado';
  const manana = new Date(`${hoy}T12:00:00`);
  manana.setDate(manana.getDate() + 1);
  return hito.fecha_compromiso <= manana.toISOString().slice(0, 10) ? 'por_vencer' : 'a_tiempo';
};

/** Días hábiles de retraso de un hito. */
export const diasRetraso = (hito) => {
  const fin = hito.fecha_real || hoyISO();
  if (fin <= hito.fecha_compromiso) return 0;
  let dias = 0;
  const d = new Date(`${hito.fecha_compromiso}T12:00:00`);
  const limite = new Date(`${fin}T12:00:00`);
  while (d < limite) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) dias += 1;
  }
  return dias;
};

export const formatoFecha = (iso) =>
  iso
    ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
    : '—';

/** Viernes más cercano (hoy si es viernes, si no el anterior). */
export const viernesDeLista = () => {
  const d = new Date();
  const atras = (d.getDay() + 2) % 7;
  d.setDate(d.getDate() - atras);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export { hoyISO };
