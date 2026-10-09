import { supabase } from './supabaseClient';

export const obtenerCuentasTecnologia = async () => {
  const { data, error } = await supabase
    .from('cuentas_tecnologia')
    .select('id, herramienta, plan, dia_renovacion, costo, moneda')
    .order('dia_renovacion')
    .order('herramienta');
  if (error) throw new Error(error.message || 'No se pudieron cargar las cuentas.');
  return data;
};

export const guardarCuentaTecnologia = async ({ id, ...cuenta }) => {
  const consulta = id
    ? supabase.from('cuentas_tecnologia').update(cuenta).eq('id', id)
    : supabase.from('cuentas_tecnologia').insert(cuenta);
  const { error } = await consulta;
  if (error) throw new Error(error.message || 'No se pudo guardar la cuenta.');
};

export const eliminarCuentaTecnologia = async (id) => {
  const { error } = await supabase.from('cuentas_tecnologia').delete().eq('id', id);
  if (error) throw new Error(error.message || 'No se pudo eliminar la cuenta.');
};
