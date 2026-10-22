import { supabase } from './supabaseClient';

const resultado = ({data,error}) => { if(error) throw Object.assign(new Error(error.message || 'No se pudo completar la operación BPS.'),{code:error.code}); return data; };
export const ejecutarBps = async (accion, datos) => resultado(await supabase.rpc('bps_ejecutar',{p_accion:accion,p_datos:datos}));
export const miAccesoBps = async userId => resultado(await supabase.from('bps_accesos').select('*').eq('user_id',userId).eq('activo',true).maybeSingle());
export const accesosBps = async () => resultado(await supabase.from('bps_accesos').select('*').order('nombre'));
export const corridasBps = async () => resultado(await supabase.from('bps_corridas').select('*,bps_oportunidades(count)').order('fecha',{ascending:false}).order('id',{ascending:false}));
export async function oportunidadesBps(filtros={},pagina=0) {
 let q=supabase.from('bps_oportunidades').select('*',{count:'exact'}).order('prioridad',{ascending:false}).order('creado_en',{ascending:false}).order('id',{ascending:false});
 if(filtros.q?.trim()) q=q.ilike('nombre',`%${filtros.q.trim().replace(/[\\%_]/g,'\\$&')}%`);
 for(const campo of ['tipo','pais','sector','fit','multiplicador','prioridad','estado','responsable_id','corrida_id']) if(filtros[campo]) q=q.eq(campo,filtros[campo]);
 const r=await q.range(pagina*30,pagina*30+29); resultado(r); return {filas:r.data,total:r.count};
}
export const oportunidadBps = async id => resultado(await supabase.from('bps_oportunidades').select('*,bps_comentarios(*),bps_actividad(*)').eq('id',id).single());
