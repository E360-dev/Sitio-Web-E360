export function hoyBogota(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function siguienteRenovacion(cuenta) {
  if (!cuenta.fecha_renovacion) return null;
  const [year, month] = cuenta.fecha_renovacion.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + (cuenta.periodicidad === 'anual' ? 12 : 1), 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(cuenta.dia_renovacion, last));
  return target.toISOString().slice(0, 10);
}

export function estadoPago(cuenta, hoy = hoyBogota()) {
  if (!cuenta.fecha_renovacion) return { texto: 'Sin confirmar', color: 'bg-slate-100 text-slate-600', cubierto: false };
  const dias = Math.round((Date.parse(cuenta.fecha_renovacion) - Date.parse(hoy)) / 86400000);
  if (dias <= 0) return { texto: 'Pago por confirmar', color: 'bg-red-50 text-red-700', cubierto: false };
  if (!cuenta.ultimo_pago_id) return { texto: 'Sin confirmar', color: 'bg-slate-100 text-slate-600', cubierto: false };
  return dias <= 5
    ? { texto: 'Por renovar', color: 'bg-amber-50 text-amber-800', cubierto: false }
    : { texto: 'Al día', color: 'bg-emerald-50 text-emerald-700', cubierto: true };
}

export function puedeDeshacer(cuenta, now = Date.now()) {
  return Boolean(cuenta.ultimo_pago_id && cuenta.pago_deshacer_hasta && now < Date.parse(cuenta.pago_deshacer_hasta));
}
