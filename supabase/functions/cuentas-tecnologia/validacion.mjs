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
  if (!['COP','USD','EUR'].includes(input.moneda)) throw new Error('DATOS_INVALIDOS');
  return {
    ...(nuevo ? {} : { id: validarId(input.id) }), nuevo,
    herramienta: text(input.herramienta, 120, true), plan: text(input.plan, 120, true),
    correo, uso: text(input.uso ?? '', 6000, nuevo), fecha_renovacion: fecha || null, costo, moneda: input.moneda,
  };
}
