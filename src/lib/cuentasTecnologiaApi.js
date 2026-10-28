import { supabase } from './supabaseClient';

export const obtenerCuentasTecnologia = async () => {
  const { data, error } = await supabase
    .from('cuentas_tecnologia')
    .select('id, herramienta, plan, dia_renovacion, fecha_renovacion, correo, uso, costo, moneda, tiene_contrasena, periodicidad, pago_version, pago_deshacer_hasta, ultimo_pago_id, ultimo_pago_en, ultimo_pago_por')
    .order('fecha_renovacion', { nullsFirst: true })
    .order('herramienta');
  if (error) throw new Error(error.message || 'No se pudieron cargar las cuentas.');
  return data;
};

export async function operarCuentasTecnologia(accion, datos = {}, desbloqueo = null) {
  const { data, error } = await supabase.functions.invoke('cuentas-tecnologia', {
    body: { accion, ...datos, ...(desbloqueo ? { desbloqueo } : {}) },
  });
  if (error) {
    let detail;
    try { detail = await error.context?.json(); } catch { /* Network / gateway errors have no JSON body. */ }
    const fallo = new Error(detail?.error || 'No se pudo completar la operación. Comprueba la conexión.');
    fallo.codigo = detail?.codigo;
    throw fallo;
  }
  return data;
}
