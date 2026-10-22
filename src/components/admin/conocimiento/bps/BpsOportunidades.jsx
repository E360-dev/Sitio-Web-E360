import { useCallback,useEffect,useRef,useState } from 'react';
import { Link,useSearchParams } from 'react-router-dom';
import { oportunidadesBps } from '../../../../lib/bpsApi';
import { BPS,ESTADOS_BPS,TIPOS_BPS,PRIORIDADES_BPS,textoBps } from '../../../../lib/bpsModelo.mjs';
import { useBps } from './RadarBps';
import { botonBps,campoBps,secundarioBps,CampoBps,ErrorBps,EtiquetaBps,TarjetaBps } from './BpsUi';
import BpsFormulario from './BpsFormulario';

export default function BpsOportunidades(){
 const {acceso,tandas,accesos,nombreDe,recargar}=useBps();const [params,setParams]=useSearchParams();const clave=params.toString();
 const [lista,setLista]=useState({filas:[],total:0});const [error,setError]=useState('');const [cargando,setCargando]=useState(true);const [nuevo,setNuevo]=useState(false);const peticion=useRef(0);
 const pagina=Math.max(0,Number(params.get('pagina'))||0);
 const cargar=useCallback(async()=>{const n=++peticion.current;setCargando(true);try{const p=new URLSearchParams(clave);const datos=await oportunidadesBps(Object.fromEntries(p),Math.max(0,Number(p.get('pagina'))||0));if(n===peticion.current){setLista(datos);setError('');}}catch(e){if(n===peticion.current)setError(e.message);}finally{if(n===peticion.current)setCargando(false);}},[clave]);
 useEffect(()=>{cargar();return()=>{peticion.current++;};},[cargar]);
 function filtro(k,v){const p=new URLSearchParams(params);if(v)p.set(k,v);else p.delete(k);if(k!=='pagina')p.delete('pagina');setParams(p,{replace:true});}
 const filtros=[['tipo','Tipo',Object.entries(TIPOS_BPS)],['estado','Estado',Object.entries(ESTADOS_BPS)],['fit','Fit',['A','B','C'].map(v=>[v,v])],['multiplicador','Multiplicador',[[1,'1x'],[1.5,'1.5x'],[2,'2x']]],['prioridad','Prioridad',Object.entries(PRIORIDADES_BPS)],['responsable_id','Responsable',accesos.map(a=>[a.user_id,a.nombre])],['corrida_id','Tanda',tandas.map(t=>[t.id,t.nombre])]];
 return <div className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Oportunidades</h2><div className="flex gap-2"><button className={secundarioBps} onClick={cargar}>Actualizar listado</button>{acceso.carga&&<button className={botonBps} onClick={()=>setNuevo(true)}>Nueva oportunidad</button>}</div></div>
  {nuevo&&(tandas.length?<BpsFormulario corridaId={params.get('corrida_id')||''} alCancelar={()=>setNuevo(false)} alGuardar={async()=>{setNuevo(false);await Promise.all([cargar(),recargar()]);}}/>:<TarjetaBps><p>Primero crea una tanda para agrupar la investigación.</p><Link className="underline" to={`${BPS}/tandas`}>Ir a Tandas</Link></TarjetaBps>)}
  <TarjetaBps><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><CampoBps titulo="Buscar por nombre"><input className={campoBps} value={params.get('q')||''} onChange={e=>filtro('q',e.target.value)}/></CampoBps>{filtros.map(([k,n,opciones])=><CampoBps titulo={n} key={k}><select className={campoBps} value={params.get(k)||''} onChange={e=>filtro(k,e.target.value)}><option value="">Todos</option>{opciones.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></CampoBps>)}{[['pais','País exacto'],['sector','Sector exacto']].map(([k,n])=><CampoBps key={k} titulo={n}><input className={campoBps} value={params.get(k)||''} onChange={e=>filtro(k,e.target.value)}/></CampoBps>)}</div><button className="mt-3 text-sm underline" onClick={()=>setParams({})}>Limpiar filtros</button></TarjetaBps>
  <ErrorBps error={error} reintentar={cargar}/><p role="status" className="text-sm text-gray-500">{cargando?'Actualizando…':`${lista.total} ${lista.total===1?'oportunidad':'oportunidades'}`}</p>
  <div className="grid min-w-0 gap-4 lg:grid-cols-2">{lista.filas.map(o=><Link key={o.id} to={`${BPS}/oportunidad/${o.id}`} className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm hover:border-[#355c8f]"><div className="flex flex-wrap gap-2"><EtiquetaBps>{PRIORIDADES_BPS[o.prioridad]}</EtiquetaBps><EtiquetaBps>{ESTADOS_BPS[o.estado]}</EtiquetaBps></div><h3 className="mt-3 break-words text-lg font-bold text-[#1a2f4e]">{o.nombre}</h3><p className="mt-2 text-sm text-gray-600">{TIPOS_BPS[o.tipo]} · {textoBps(o.pais)} · {textoBps(o.sector)}</p><p className="mt-2 text-sm">Fit {textoBps(o.fit)} · {o.multiplicador?`${o.multiplicador}x`:'Multiplicador por investigar'}</p><p className="mt-2 text-sm text-gray-500">Responsable: {nombreDe(o.responsable_id)}</p></Link>)}</div>
  {!cargando&&!lista.total&&!error&&<TarjetaBps>No hay oportunidades con estos filtros.</TarjetaBps>}
  <div className="flex items-center gap-3"><button className={secundarioBps} disabled={!pagina||cargando} onClick={()=>filtro('pagina',String(pagina-1))}>Anterior</button><span className="text-sm">Página {pagina+1}</span><button className={secundarioBps} disabled={(pagina+1)*30>=lista.total||cargando} onClick={()=>filtro('pagina',String(pagina+1))}>Siguiente</button></div>
 </div>;
}
