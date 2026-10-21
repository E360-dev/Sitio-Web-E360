export const ordenPaso = (hito) => hito.radar_pasos?.orden ?? (hito.paso === 10 ? 35 : hito.paso * 10);
export const etiquetaPaso = (paso, catalogo = []) => catalogo.find((p) => p.paso === paso)?.etiqueta || (paso === 10 ? '3B' : String(paso));
export const pasoActual = (hitos = []) => [...hitos].sort((a, b) => ordenPaso(a) - ordenPaso(b)).find((h) => !h.fecha_real && !h.exento_revision) || null;
export const ultimaVersion = (archivos, tipo) => archivos.filter((a) => a.paso === 3 && a.tipo === tipo).sort((a, b) => b.version - a.version)[0];
export const requiereCorreccion = (prospecto) => (prospecto.radar_observaciones || []).some((o) => {
 if (o.tipo !== 'correccion' || o.resuelta_en) return false;
 const original = prospecto.radar_archivos?.find((a) => a.id === o.archivo_id);
 return original && !prospecto.radar_archivos.some((a) => a.paso === 3 && a.tipo === original.tipo && a.version > original.version);
});
export function estadoDocumento(archivo, archivos, observaciones = []) {
  if (!archivo) return 'pendiente';
  const ids = new Set(archivos.filter((a) => a.tipo === archivo.tipo && a.paso === 3).map((a) => a.id));
  const pendientes = observaciones.filter((o) => ids.has(o.archivo_id) && o.tipo === 'correccion' && !o.resuelta_en);
  if (pendientes.some((o) => o.archivo_id === archivo.id)) return 'requiere_correccion';
  if (pendientes.length) return 'pendiente';
  return archivo.radar_revisiones?.length ? 'aprobado' : 'pendiente';
}
export function destinoNotificacion(n) {
  if (n.clave?.startsWith('lista:')) return '/admin/conocimiento/radar/lista-corta';
  if (!n.prospecto_id) return '/admin/conocimiento/radar';
  const params = new URLSearchParams();
  if (n.archivo_id) params.set('archivo', n.archivo_id);
  if (n.paso) params.set('paso', n.paso);
  return `/admin/conocimiento/radar/prospecto/${n.prospecto_id}${params.size ? `?${params}` : ''}`;
}
