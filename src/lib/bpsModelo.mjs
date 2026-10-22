export const BPS = '/admin/conocimiento/radar-bps';
export const ESTADOS_BPS = { nueva: 'Nueva', validada: 'Validada', en_contacto: 'En contacto', descartada: 'Descartada' };
export const TIPOS_BPS = { directa: 'Cuenta directa', canal: 'Pecera / canal' };
export const PRIORIDADES_BPS = { 0: 'Por investigar', 1: 'Baja', 2: 'Media', 3: 'Alta', 4: 'Máxima' };
export const CAMPOS_CARGA = ['corrida_id','nombre','tamano','tipo','fit','multiplicador','detonante','dolor','persona_objetivo','ruta_acceso','canal_contacto','siguiente_accion','fuentes','pais','sector','sitio_web','ingresos','moneda'];
export const CAMPOS_GESTION = ['fit','multiplicador','persona_objetivo','ruta_acceso','canal_contacto','siguiente_accion','responsable_id','crm_url'];
export const VACIA_BPS = Object.fromEntries([...new Set([...CAMPOS_CARGA,...CAMPOS_GESTION])].map(k=>[k, k==='tipo'?'directa':k==='moneda'?'MXN':'']));
export const textoBps = valor => valor === null || valor === undefined || valor === '' ? 'Por investigar' : String(valor);
export function prioridadBps(fit, multiplicador) {
 if (!fit || !multiplicador) return 0;
 if (fit==='A' && Number(multiplicador)===2) return 4;
 if ((fit==='A' && Number(multiplicador)===1.5)||(fit==='B' && Number(multiplicador)===2)) return 3;
 if ((fit==='A' && Number(multiplicador)===1)||(fit==='B' && Number(multiplicador)===1.5)) return 2;
 return 1;
}
export function destinosBps(estado) {
 return [...(estado==='nueva'?['validada']:estado==='validada'?['en_contacto']:[]), ...(estado!=='descartada'?['descartada']:[]), ...(estado!=='nueva'?['nueva']:[])];
}
export function cambiosBps(inicial, valores, acceso, nueva=false) {
 const permitidos=[...(acceso?.carga?CAMPOS_CARGA:[]),...(acceso?.gestion?CAMPOS_GESTION:[])];
 return Object.fromEntries([...new Set(permitidos)].filter(k=>nueva || String(inicial[k]??'')!==String(valores[k]??'')).map(k=>{
  const valor=valores[k];
  return [k,['fit','multiplicador','ingresos','responsable_id'].includes(k)&&valor===''?null:valor];
 }));
}
export const fechaLocalBps = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function enlaceBps(url) { try { const u=new URL(url); return ['https:','http:'].includes(u.protocol)?u.href:null; } catch { return null; } }
