import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { ejecutarBps } from '../../../../lib/bpsApi';
import { BPS,fechaLocalBps } from '../../../../lib/bpsModelo.mjs';
import { useBps } from './RadarBps';
import { botonBps,campoBps,secundarioBps,CampoBps,ErrorBps,TarjetaBps } from './BpsUi';

function FormularioTanda({inicial,cerrar}){
 const {recargar,borradores,guardarBorrador}=useBps();const clave=`tanda:${inicial?.id||'nueva'}`;
 const [datos,setDatos]=useState(()=>borradores[clave]||inicial||{nombre:'',fecha:fechaLocalBps(),criterios:'',notas:''});
 const [error,setError]=useState('');const [ocupado,setOcupado]=useState(false);
 useEffect(()=>guardarBorrador(clave,datos),[clave,datos,guardarBorrador]);
 async function guardar(e){e.preventDefault();setOcupado(true);setError('');try{
  await ejecutarBps('tanda_guardar',{...(inicial?{id:inicial.id,revision:inicial.revision}:{}),campos:Object.fromEntries(['nombre','fecha','criterios','notas'].map(k=>[k,datos[k]]))});
  guardarBorrador(clave,null);await recargar();cerrar();
 }catch(e){setError(e.message);}finally{setOcupado(false);}}
 return <TarjetaBps titulo={inicial?'Editar tanda':'Nueva tanda'}><form onSubmit={guardar} className="space-y-4"><ErrorBps error={error}/>{[['nombre','Nombre de la tanda'],['fecha','Fecha'],['criterios','Criterios de búsqueda'],['notas','Notas']].map(([k,n])=><CampoBps key={k} titulo={n}>{['criterios','notas'].includes(k)?<textarea name={k} className={campoBps} rows={3} maxLength={10000} disabled={ocupado} value={datos[k]} onChange={e=>setDatos(d=>({...d,[k]:e.target.value}))}/>:<input name={k} className={campoBps} required maxLength={200} disabled={ocupado} type={k==='fecha'?'date':'text'} value={datos[k]} onChange={e=>setDatos(d=>({...d,[k]:e.target.value}))}/>}</CampoBps>)}<div className="flex gap-3"><button className={botonBps} disabled={ocupado}>Guardar tanda</button><button type="button" className={secundarioBps} disabled={ocupado} onClick={cerrar}>Cancelar</button></div></form></TarjetaBps>;
}
export default function BpsTandas(){
 const {tandas,acceso}=useBps();const [editar,setEditar]=useState(undefined);
 return <div className="space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Tandas de investigación</h2>{acceso.carga&&<button className={botonBps} onClick={()=>setEditar(null)}>Nueva tanda</button>}</div><p className="text-sm text-gray-500">Cada tanda conserva los criterios y la fecha de una búsqueda. No hay límite de oportunidades ni calendario obligatorio.</p>
  {editar!==undefined&&<FormularioTanda key={editar?.id||'nueva'} inicial={editar} cerrar={()=>setEditar(undefined)}/>}
  {!tandas.length&&<TarjetaBps>Todavía no hay tandas.</TarjetaBps>}{tandas.map(t=><TarjetaBps key={t.id} titulo={t.nombre}><p className="text-sm text-gray-500">{t.fecha} · {t.bps_oportunidades?.[0]?.count||0} oportunidades</p><p className="my-3 whitespace-pre-wrap break-words text-sm">{t.criterios||'Sin criterios registrados'}</p>{t.notas&&<p className="mb-3 whitespace-pre-wrap break-words text-sm text-gray-500">{t.notas}</p>}<div className="flex flex-wrap gap-3"><Link className={secundarioBps} to={`${BPS}?corrida_id=${t.id}`}>Ver oportunidades</Link>{acceso.carga&&<button className={secundarioBps} onClick={()=>setEditar(t)}>Editar tanda</button>}</div></TarjetaBps>)}
 </div>;
}
