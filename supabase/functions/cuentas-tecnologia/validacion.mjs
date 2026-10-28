const text = (value, max, required = false) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('DATOS_INVALIDOS');
  return value.trim();
};

export function validarId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('DATOS_INVALIDOS');
  return id;
}

export function validarCuenta(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('DATOS_INVALIDOS');
  const nuevo = input.id == null;
  const fecha = text(input.fecha_renovacion ?? '', 10, nuevo);
  if (fecha && (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(Date.parse(fecha)) || new Date(fecha).toISOString().slice(0,10) !== fecha)) throw new Error('DATOS_INVALIDOS');
  const correo = text(input.correo ?? '', 254, nuevo);
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('DATOS_INVALIDOS');
  const costo = input.costo === '' || input.costo == null ? null : Number(input.costo);
  if (costo !== null && (!Number.isFinite(costo) || costo < 0 || costo > 9999999999.99)) throw new Error('DATOS_INVALIDOS');
  if (!['MXN','COP','USD','EUR'].includes(input.moneda)) throw new Error('DATOS_INVALIDOS');
  if (input.periodicidad != null && !['mensual', 'anual'].includes(input.periodicidad)) throw new Error('DATOS_INVALIDOS');
  return {
    ...(input.periodicidad != null ? { periodicidad: input.periodicidad } : {}),
    ...(nuevo ? {} : { id: validarId(input.id) }), nuevo,
    herramienta: text(input.herramienta, 120, true), plan: text(input.plan, 120, true),
    correo, uso: text(input.uso ?? '', 6000, nuevo), fecha_renovacion: fecha || null, costo, moneda: input.moneda,
  };
}

export function validarPago(input) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(input.operacion_id) || !Number.isSafeInteger(input.version) || input.version < 0) throw new Error('DATOS_INVALIDOS');
  const datos = { id: validarId(input.id), operacion_id: input.operacion_id, version: input.version };
  if (input.accion === 'deshacer_pago') {
    if (!uuid.test(input.pago_id)) throw new Error('DATOS_INVALIDOS');
    datos.pago_id = input.pago_id;
  } else if (input.fecha_renovacion != null) {
    const value = input.fecha_renovacion;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('DATOS_INVALIDOS');
    datos.fecha_renovacion = value;
  }
  return datos;
}
