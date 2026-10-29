export const CAMPOS_FICHA = ['empresa', 'sector', 'ciudad', 'pais', 'paises_operacion', 'sitio_web', 'tipo_sitio_web', 'linkedin_empresa', 'que_hace', 'como_opera', 'tamano_estructura', 'senal', 'senal_fecha', 'senal_fuente', 'por_que_ahora', 'servicio_principal', 'servicios', 'pendientes_validar', 'investigado_el', 'score', 'fecha_lista'];
export const BLOQUES_EVIDENCIA = {
  identificacion: 'Identificación', entendimiento: 'Qué hace y cómo opera', tamano: 'Tamaño y estructura', senal: 'Señal', servicios: 'Servicios', contactos: 'Contactos',
};
export const ESTADOS_EVIDENCIA = { con_fuente: 'Dato con fuente', estimacion: 'Estimación', por_validar: 'Por validar' };
export const ESTADOS_CONTACTO = { por_validar: 'Por validar', con_fuente: 'Cargo contrastado con fuente' };
export const urlSegura = (valor) => {
  try { const url = new URL(valor); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
};
export function datosFicha(p = {}) {
  const datos = Object.fromEntries(CAMPOS_FICHA.map((k) => [k, p[k] ?? '']));
  datos.tipo_sitio_web = p.tipo_sitio_web || (p.sitio_web ? 'sin_definir' : 'web');
  datos.contactos = (p.contactos || []).map((c) => ({ ...c }));
  datos.evidencias = (p.evidencias || []).map((e) => ({ ...e }));
  return datos;
}
export function prepararFicha(datos, nuevo = false) {
  const salida = Object.fromEntries(CAMPOS_FICHA.map((k) => [k, typeof datos[k] === 'string' ? datos[k].trim() : datos[k]]));
  salida.score = salida.score === '' || salida.score == null ? null : Number(salida.score);
  for (const k of ['senal_fecha', 'investigado_el']) salida[k] ||= null;
  if (!salida.empresa || !salida.fecha_lista) throw new Error('Completa la empresa y la fecha de lista.');
  if (nuevo && ['que_hace', 'senal', 'por_que_ahora', 'servicio_principal'].some((k) => !salida[k])) throw new Error('Completa qué hace, señal, hipótesis y servicio principal.');
  if (salida.score != null && (!Number.isInteger(salida.score) || salida.score < 0)) throw new Error('El score debe ser un entero positivo o cero.');
  for (const k of ['sitio_web', 'linkedin_empresa', 'senal_fuente']) if (salida[k] && !urlSegura(salida[k])) throw new Error('Los enlaces deben comenzar con http:// o https://.');
  salida.contactos = datos.contactos.map((c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])));
  salida.evidencias = datos.evidencias.map((e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])));
  for (const c of salida.contactos) {
    if (!c.nombre || !ESTADOS_CONTACTO[c.estado]) throw new Error('Cada contacto necesita nombre y estado de validación.');
    if (c.linkedin && !urlSegura(c.linkedin)) throw new Error('El enlace del contacto debe ser HTTP/HTTPS.');
  }
  for (const e of salida.evidencias) {
    if (!BLOQUES_EVIDENCIA[e.bloque] || !e.nombre || !ESTADOS_EVIDENCIA[e.estado]) throw new Error('Cada evidencia necesita bloque, nombre y estado.');
    if ((e.enlace && !urlSegura(e.enlace)) || (e.estado === 'con_fuente' && (!e.enlace || !e.fecha_consulta))) throw new Error('Un dato con fuente necesita enlace HTTP/HTTPS y fecha de consulta.');
  }
  return salida;
}
