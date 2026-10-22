import { createContext,useCallback,useContext,useEffect,useRef,useState } from 'react';
import { Link,NavLink,Navigate,Route,Routes } from 'react-router-dom';
import { useRol } from '../../../../hooks/useRol';
import { accesosBps,corridasBps,miAccesoBps } from '../../../../lib/bpsApi';
import { BPS } from '../../../../lib/bpsModelo.mjs';
import { ErrorBps,TarjetaBps } from './BpsUi';
import BpsOportunidades from './BpsOportunidades';
import BpsDetalle from './BpsDetalle';
import BpsTandas from './BpsTandas';
import BpsAccesos from './BpsAccesos';

const ContextoBps=createContext(null);
export const useBps=()=>useContext(ContextoBps);
export default function RadarBps() {
 const {user,rol,loading}=useRol();
 const [datos,setDatos]=useState({identidad:null,acceso:null,accesos:[],tandas:[],cargando:true,error:''});
 const [borradores,setBorradores]=useState({});
 const ultimo=useRef(0); const generacion=useRef(0);
 const cargar=useCallback(async()=>{
  if(!user || loading) return;
  const revision=++generacion.current;
  try {
   const acceso=await miAccesoBps(user.id);
   const [accesos,tandas]=await Promise.all([acceso||rol==='admin'?accesosBps():[],acceso?corridasBps():[]]);
   if(revision!==generacion.current) return;
   setDatos({identidad:user.id,acceso,accesos,tandas,cargando:false,error:''}); ultimo.current=Date.now();
   if(!acceso) setBorradores({});
  } catch(e) { if(revision===generacion.current) setDatos(d=>({...d,cargando:false,error:e.message})); }
 },[user?.id,rol,loading]);
 useEffect(()=>{setBorradores({});setDatos({identidad:user?.id,acceso:null,accesos:[],tandas:[],cargando:true,error:''}); cargar(); return()=>{generacion.current++;};},[cargar]);
 useEffect(()=>{
  const visible=()=>{if(document.visibilityState==='visible'&&Date.now()-ultimo.current>60000)cargar();};
  const online=()=>cargar(); const intervalo=setInterval(visible,60000);
  document.addEventListener('visibilitychange',visible);window.addEventListener('online',online);
  return()=>{clearInterval(intervalo);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',online);};
 },[cargar]);
 const guardarBorrador=useCallback((clave,valor)=>setBorradores(d=>({...d,[clave]:valor})),[]);
 if(loading||datos.cargando||datos.identidad!==user?.id)return <p>Verificando acceso al Radar BPS…</p>;
 const admin=rol==='admin';
 if(!datos.acceso&&!admin)return <TarjetaBps titulo="Radar BPS Contable"><ErrorBps error={datos.error} reintentar={cargar}/><p>{datos.error?'No se pudo comprobar tu acceso. Reintenta cuando recuperes la conexión.':'No tienes acceso al Radar BPS. Solicita tu alta a administración.'}</p><Link to="/admin/conocimiento" className="underline">Volver al Centro de conocimiento</Link></TarjetaBps>;
 const valor={...datos,admin,recargar:cargar,borradores,guardarBorrador,nombreDe:id=>datos.accesos.find(a=>a.user_id===id)?.nombre||'Sin asignar'};
 return <ContextoBps.Provider value={valor}><div className="min-w-0 space-y-6">
  <Link to="/admin/conocimiento" className="text-sm font-semibold text-gray-500">← Centro de conocimiento</Link>
  <header className="rounded-3xl bg-[rgb(53,92,143)] p-6 text-white"><h1 className="text-3xl font-black">Radar <span className="text-[#25c6e3]">BPS Contable</span></h1><p className="mt-2 text-sm text-white/80">Cuentas directas y canales para tercerización contable.</p></header>
  <nav aria-label="Radar BPS" className="flex flex-wrap gap-2 border-b">
   {[...(datos.acceso?[['','Oportunidades'],['/tandas','Tandas']]:[]),...(admin?[['/accesos','Accesos']]:[])].map(([ruta,nombre])=><NavLink end key={ruta} to={BPS+ruta} className={({isActive})=>`px-4 py-3 font-bold text-sm ${isActive?'border-b-2 border-[#355c8f] text-[#355c8f]':'text-gray-500'}`}>{nombre}</NavLink>)}
  </nav>
  <ErrorBps error={datos.error} reintentar={cargar}/>
  <Routes>{datos.acceso?<><Route index element={<BpsOportunidades/>}/><Route path="tandas" element={<BpsTandas/>}/><Route path="oportunidad/:id" element={<BpsDetalle/>}/></>:<Route index element={<Navigate to={`${BPS}/accesos`} replace/>}/>}{admin&&<Route path="accesos" element={<BpsAccesos/>}/>}<Route path="*" element={<Navigate to={BPS} replace/>}/></Routes>
 </div></ContextoBps.Provider>;
}
