import { useEffect,useState } from 'react';
import { ejecutarBps } from '../../../../lib/bpsApi';
import { CAMPOS_CARGA,CAMPOS_GESTION,VACIA_BPS,cambiosBps,prioridadBps,PRIORIDADES_BPS } from '../../../../lib/bpsModelo.mjs';
import { useBps } from './RadarBps';
import { botonBps,campoBps,secundarioBps,CampoBps,ErrorBps,TarjetaBps } from './BpsUi';

const campos=[['nombre','Empresa o canal'],['corrida_id','Tanda','tanda'],['tipo','Tipo de oportunidad','tipo'],['pais','País'],['sector','Sector'],['sitio_web','Sitio web o LinkedIn','url'],['tamano','Tamaño y complejidad','area'],['ingresos','Ingresos anuales (informativos)','number'],['moneda','Moneda de los ingresos'],['fit','Fit BPS','fit'],['multiplicador','Multiplicador','multiplicador'],['detonante','Detonante / por qué ahora','area'],['dolor','Dolor o señal','area'],['persona_objetivo','Persona objetivo'],['ruta_acceso','Relación o ruta disponible','area'],['canal_contacto','Canal de contacto'],['siguiente_accion','Siguiente acción','area'],['fuentes','Fuentes y señales de respaldo','area'],['responsable_id','Responsable comercial','responsable'],['crm_url','Enlace al CRM','url']];
export default function BpsFormulario({inicial,alGuardar,alCancelar,corridaId=''}) {
 const {acceso,tandas,accesos,borradores,guardarBorrador}=useBps();
 const clave=`oportunidad:${inicial?.id||'nueva'}`;
 const [valores,setValores]=useState(()=>borradores[clave]||{...VACIA_BPS,...inicial,corrida_id:inicial?.corrida_id||corridaId});
 const [error,setError]=useState('');const [ocupado,setOcupado]=useState(false);
 useEffect(()=>guardarBorrador(clave,valores),[clave,valores,guardarBorrador]);
 const permitidos=[...(acceso.carga?CAMPOS_CARGA:[]),...(acceso.gestion?CAMPOS_GESTION:[])];
 async function guardar(e){e.preventDefault();setOcupado(true);setError('');try{
  const cambios=cambiosBps(inicial||{},valores,acceso,!inicial);
  if(!Object.keys(cambios).length){setError('No hay cambios para guardar.');return;}
  const dato=await ejecutarBps('oportunidad_guardar',{...(inicial?{id:inicial.id,revision:inicial.revision}:{}),campos:cambios});
  guardarBorrador(clave,null);await alGuardar(dato);
 }catch(e){setError(e.code==='40001'?`${e.message} Tu borrador se conserva; cancela la edición y recarga la ficha para comparar los cambios.`:e.message);}finally{setOcupado(false);}}
 return <TarjetaBps titulo={inicial?'Editar oportunidad':'Nueva oportunidad'}><form onSubmit={guardar} className="space-y-4">
  <p className="text-sm text-gray-500">Completa lo conocido. Los campos vacíos se mostrarán como «Por investigar». La prioridad se calcula según fit y multiplicador; no hay restricción por país o tamaño.</p>
  <ErrorBps error={error}/><div className="grid min-w-0 gap-4 sm:grid-cols-2">{campos.map(([nombre,titulo,tipo])=>{
   const disabled=ocupado||!permitidos.includes(nombre);const value=valores[nombre]??'';
   const props={name:nombre,value,disabled,onChange:e=>setValores(v=>({...v,[nombre]:e.target.value})),className:campoBps};
   let opciones=tipo==='tanda'?tandas.map(t=>[t.id,t.nombre]):tipo==='tipo'?[['directa','Cuenta directa'],['canal','Pecera / canal']]:tipo==='fit'?[['A','A'],['B','B'],['C','C']]:tipo==='multiplicador'?[[1,'1x · Individual'],[1.5,'1.5x · Cartera'],[2,'2x · Canal institucional']]:tipo==='responsable'?accesos.filter(a=>a.activo&&a.gestion).map(a=>[a.user_id,a.nombre]):null;
   return <div key={nombre} className={tipo==='area'?'sm:col-span-2':''}><CampoBps titulo={titulo}>{opciones?<select {...props} required={nombre==='corrida_id'}><option value="">{nombre==='corrida_id'?'Selecciona una tanda':'Por investigar'}</option>{opciones.map(([k,n])=><option key={k} value={k}>{n}</option>)}</select>:tipo==='area'?<textarea {...props} rows={nombre==='fuentes'?4:3} maxLength={10000}/>:<input {...props} type={tipo==='url'?'url':tipo==='number'?'number':'text'} min={tipo==='number'?0:undefined} step={tipo==='number'?'any':undefined} maxLength={nombre==='moneda'?3:nombre==='nombre'?200:2000} required={nombre==='nombre'}/>}</CampoBps></div>;
  })}</div>
  <p className="text-sm font-semibold">Prioridad estimada: {PRIORIDADES_BPS[prioridadBps(valores.fit,valores.multiplicador)]}</p>
  <div className="flex flex-wrap gap-3"><button className={botonBps} disabled={ocupado}>{ocupado?'Guardando…':'Guardar oportunidad'}</button><button type="button" className={secundarioBps} disabled={ocupado} onClick={alCancelar}>Cancelar edición</button></div>
 </form></TarjetaBps>;
}
