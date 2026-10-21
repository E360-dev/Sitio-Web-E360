import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import { destinoNotificacion } from '../../lib/radarModelo.mjs';

export default function NotificacionesRadar() {
  const { user } = useAuth(); const navigate = useNavigate();
  const [estado, setEstado] = useState({ identidad: null, acceso: false, avisos: [], pendientes: 0 });
  const [abierto, setAbierto] = useState(false); const [soloNuevas, setSoloNuevas] = useState(false); const [error, setError] = useState('');
  const modal = useRef(null); const recargar = useRef(() => {});
  useEffect(() => {
    let vivo = true, canal, consultando = false;
    setEstado({ identidad: user?.id, acceso: false, avisos: [], pendientes: 0 }); setAbierto(false); setError('');
    if (!user) return;
    const cargar = async () => {
      if (!vivo || consultando) return;
      consultando = true;
      try {
        const { data: acceso, error: falloAcceso } = await supabase.from('radar_accesos').select('user_id').eq('user_id', user.id).maybeSingle();
        if (falloAcceso) throw falloAcceso;
        if (!vivo) return;
        if (!acceso) { setEstado({ identidad: user.id, acceso: false, avisos: [], pendientes: 0 }); if (canal) { supabase.removeChannel(canal); canal = null; } return; }
        const [lista, contador] = await Promise.all([
          supabase.from('radar_notificaciones').select('*').eq('usuario_id', user.id).order('creado_en', { ascending: false }).limit(100),
          supabase.from('radar_notificaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id).is('leida_en', null),
        ]);
        if (lista.error || contador.error) throw lista.error || contador.error;
        if (!vivo) return;
        setEstado({ identidad: user.id, acceso: true, avisos: lista.data, pendientes: contador.count || 0 }); setError('');
        if (!canal) canal = supabase.channel(`radar-notificaciones-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'radar_notificaciones', filter: `usuario_id=eq.${user.id}` }, cargar).subscribe((status) => { if (status === 'SUBSCRIBED') cargar(); });
      } catch { if (vivo) setError('No se pudieron actualizar las notificaciones. Se reintentará al recuperar la conexión.'); }
      finally { consultando = false; }
    };
    recargar.current = cargar;
    const visible = () => { if (document.visibilityState === 'visible') cargar(); };
    cargar(); const intervalo = setInterval(visible, 60000);
    window.addEventListener('online', cargar); window.addEventListener('focus', visible); document.addEventListener('visibilitychange', visible);
    return () => { vivo = false; clearInterval(intervalo); if (canal) supabase.removeChannel(canal); window.removeEventListener('online', cargar); window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible); };
  }, [user?.id]);
  useEffect(() => { if (abierto) modal.current?.showModal(); else modal.current?.close(); }, [abierto]);
  const marcar = async (id) => {
    let query = supabase.from('radar_notificaciones').update({ leida_en: new Date().toISOString() }).eq('usuario_id', user.id).is('leida_en', null);
    if (id) query = query.eq('id', id);
    const { error: fallo } = await query;
    if (fallo) setError('No se pudo guardar la lectura.'); else { await recargar.current(); }
  };
  if (!estado.acceso || estado.identidad !== user?.id) return null;
  return <div className="flex justify-end mb-4">
    <button className="inline-flex items-center gap-2 rounded-full bg-white border px-4 py-2 text-sm font-semibold shadow-sm" aria-label={`Notificaciones del Radar: ${estado.pendientes} sin leer`} onClick={() => { setAbierto(true); recargar.current(); }}>
      <BellIcon className="h-5 w-5" /> Notificaciones {estado.pendientes > 0 && <span className="rounded-full bg-red-600 text-white text-xs px-2 py-0.5">{estado.pendientes}</span>}
    </button>
    <dialog ref={modal} onCancel={(e) => { e.preventDefault(); setAbierto(false); }} className="w-[94vw] max-w-xl max-h-[85dvh] rounded-2xl p-5 backdrop:bg-black/40">
      <header className="flex justify-between gap-4"><h2 className="font-bold text-xl">Notificaciones del Radar</h2><button aria-label="Cerrar notificaciones" onClick={() => setAbierto(false)}>Cerrar ✕</button></header>
      <div className="flex flex-wrap justify-between gap-3 my-4 text-sm"><label><input type="checkbox" checked={soloNuevas} onChange={(e) => setSoloNuevas(e.target.checked)} /> Solo no leídas</label><button className="underline text-blue-800" onClick={() => marcar()}>Marcar todas como leídas</button></div>
      {error && <p role="status" className="text-amber-800 text-sm">{error}</p>}
      <ul className="space-y-2">{estado.avisos.filter((n) => !soloNuevas || !n.leida_en).map((n) => <li key={n.id}>
        <button className={`text-left w-full rounded-xl border p-3 ${n.leida_en ? 'bg-white' : 'bg-blue-50 border-blue-200'}`} onClick={async () => { await marcar(n.id); setAbierto(false); navigate(destinoNotificacion(n)); }}>
          <p className="font-bold text-sm">{!n.leida_en && '● '}{n.titulo}</p><p className="text-sm whitespace-pre-wrap break-words mt-1">{n.texto}</p><p className="text-xs text-gray-500 mt-2">{new Date(n.creado_en).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
        </button>
      </li>)}</ul>
      {!estado.avisos.some((n) => !soloNuevas || !n.leida_en) && <p className="text-sm text-gray-500 py-6">No hay notificaciones{soloNuevas ? ' sin leer' : ''}.</p>}
      <p className="text-xs text-gray-400 mt-4">Últimos 100 avisos. Los recordatorios se generan los días hábiles a las 09:00 de Bogotá.</p>
    </dialog>
  </div>;
}
