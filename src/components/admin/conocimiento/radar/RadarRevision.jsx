import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { revisarArchivo, subirArchivo, TIPOS_ARCHIVO, FORMATOS_ACEPTADOS } from '../../../../lib/radarApi';
import { ultimaVersion, estadoDocumento } from '../../../../lib/radarModelo.mjs';
import { useRadar } from './RadarComercial.jsx';
import { claseBoton, claseBotonSecundario, claseCampo } from './RadarUi.jsx';
import VisorRadar from './VisorRadar.jsx';

const etiquetaEstado = { pendiente: 'Pendiente de revisión', requiere_correccion: 'Requiere corrección', aprobado: 'Aprobado' };
const fecha = (value) => new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

export function ComentariosDocumento({ archivo, prospecto, onCambio }) {
  const { nombreDe, puedePaso } = useRadar();
  const [texto, setTexto] = useState(''); const [resueltas, setResueltas] = useState([]); const [ocupado, setOcupado] = useState(false);
  const archivos = prospecto.radar_archivos || [];
  const porId = (id) => archivos.find((a) => a.id === id);
  const vigente = ultimaVersion(archivos, archivo.tipo);
  const observaciones = (prospecto.radar_observaciones || []).filter((o) => porId(o.archivo_id)?.tipo === archivo.tipo).sort((a, b) => a.creado_en.localeCompare(b.creado_en));
  const pendientes = observaciones.filter((o) => o.tipo === 'correccion' && !o.resuelta_en);
  const abierta = prospecto.radar_hitos?.some((h) => h.paso === 10 && !h.fecha_real && !h.exento_revision) && prospecto.radar_hitos?.some((h) => h.paso === 3 && h.fecha_real);
  const actual = vigente?.id === archivo.id;
  const esRevisor = puedePaso(10) && abierta && actual;
  const ejecutar = async (accion, ids = []) => {
    setOcupado(true);
    try { await revisarArchivo(archivo.id, accion, texto, ids); setTexto(''); setResueltas([]); onCambio(); toast.success('Revisión guardada.'); }
    catch (e) { toast.error(e.message); }
    finally { setOcupado(false); }
  };
  return <div className="space-y-4 text-sm">
    <h3 className="font-bold text-lg">Comentarios del documento</h3>
    <p className="text-xs text-gray-500">Se conserva el historial de todas las versiones. Estás viendo v{archivo.version}{actual ? ' (vigente)' : ' (histórica)'}.</p>
    {!observaciones.length && <p className="text-gray-500">Sin comentarios todavía.</p>}
    {observaciones.map((o) => <article key={o.id} className={`rounded-xl border p-3 ${o.tipo === 'correccion' && !o.resuelta_en ? 'bg-amber-50 border-amber-200' : 'bg-slate-50'}`}>
      <p className="font-bold text-xs">{o.origen === 'portal' ? nombreDe(o.autor) : o.origen} · v{porId(o.archivo_id)?.version}</p>
      <p className="text-xs text-gray-500">{fecha(o.creado_en)} · {o.tipo === 'correccion' ? o.resuelta_en ? 'Resuelta' : o.atendida_en ? 'Atendida por JD; falta validar' : 'Corrección pendiente' : 'Comentario'}</p>
      <p className="mt-2 whitespace-pre-wrap break-words">{o.texto}</p>
      {o.resuelta_en && <p className="mt-2 text-xs text-emerald-700">Validó {nombreDe(o.resuelta_por)} · {fecha(o.resuelta_en)}</p>}
      {o.tipo === 'correccion' && !o.resuelta_en && actual && abierta && archivo.version > (porId(o.archivo_id)?.version || 0) && <div className="mt-2">
        {puedePaso(3) && !o.atendida_en && <button className="text-blue-800 underline" disabled={ocupado} onClick={() => ejecutar('atender', [o.id])}>Marcar corrección atendida</button>}
        {esRevisor && <label className="flex items-start gap-2"><input type="checkbox" checked={resueltas.includes(o.id)} onChange={(e) => setResueltas(e.target.checked ? [...resueltas, o.id] : resueltas.filter((id) => id !== o.id))} /><span>Confirmo que esta observación está resuelta</span></label>}
      </div>}
    </article>)}
    {archivo.paso === 3 && <form className="space-y-2 border-t pt-3" onSubmit={(e) => { e.preventDefault(); ejecutar('comentar'); }}>
      <label className="block font-semibold" htmlFor={`comentario-doc-${archivo.id}`}>Nuevo comentario</label>
      <textarea id={`comentario-doc-${archivo.id}`} className={claseCampo} rows={4} maxLength={12000} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Describe el comentario o la corrección de esta versión…" />
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={claseBotonSecundario} disabled={ocupado || !texto.trim()}>Comentar</button>
        {esRevisor && <button type="button" className={claseBotonSecundario} disabled={ocupado || !texto.trim()} onClick={() => ejecutar('corregir')}>Solicitar corrección</button>}
      </div>
      {esRevisor && <div className="pt-3 space-y-2">
        <p className="text-xs text-gray-500">Basta el visto bueno de JL o Jhon. Las correcciones de ambos deben quedar resueltas.</p>
        <button type="button" className={claseBoton} disabled={ocupado || pendientes.some((o) => o.archivo_id === archivo.id) || pendientes.some((o) => !resueltas.includes(o.id)) || estadoDocumento(archivo, archivos, observaciones) === 'aprobado'} onClick={() => ejecutar('aprobar', resueltas)}>Aprobar esta versión</button>
        {pendientes.some((o) => o.archivo_id === archivo.id) && <p className="text-amber-800 text-xs">JD debe subir una nueva versión antes de aprobar.</p>}
      </div>}
    </form>}
  </div>;
}

export function PrevisualizarDocumento({ archivo, prospecto, cerrar, onCambio }) {
  return <VisorRadar archivo={archivo} cerrar={cerrar}>{archivo.paso === 3 ? <ComentariosDocumento key={archivo.id} archivo={archivo} prospecto={prospecto} onCambio={onCambio} /> : null}</VisorRadar>;
}

export default function RadarRevision({ prospecto, onCambio }) {
  const { puedePaso, nombreDe } = useRadar();
  const [seleccionado, setSeleccionado] = useState(null); const [subiendo, setSubiendo] = useState(null);
  const archivos = prospecto.radar_archivos || [];
  const hito = prospecto.radar_hitos?.find((h) => h.paso === 10);
  const abierto = hito && !hito.fecha_real && !hito.exento_revision;
  const seleccionadoActual = archivos.find((a) => a.id === seleccionado);
  const subir = async (tipo, file) => {
    if (!file) return;
    setSubiendo(tipo);
    try { await subirArchivo({ prospectoId: prospecto.id, paso: 3, tipo, archivo: file }); onCambio(); toast.success('Nueva versión guardada; pendiente de revisión.'); }
    catch (e) { toast.error(e.message); }
    finally { setSubiendo(null); }
  };
  return <div className="space-y-4">
    <p className="text-sm text-gray-600">Revisión individual de los cuatro documentos. Una aprobación de JL o Jhon por documento es suficiente; las observaciones pendientes bloquean el avance.</p>
    <div className="grid md:grid-cols-2 gap-4">{TIPOS_ARCHIVO[3].map(({ tipo, nombre }) => {
      const archivo = ultimaVersion(archivos, tipo); const estado = estadoDocumento(archivo, archivos, prospecto.radar_observaciones);
      const revision = archivo?.radar_revisiones?.[0];
      return <section key={tipo} className="rounded-xl border p-4 space-y-3 min-w-0">
        <h4 className="font-bold">{nombre}</h4>
        <p className={`text-xs font-bold ${estado === 'aprobado' ? 'text-emerald-700' : estado === 'requiere_correccion' ? 'text-amber-800' : 'text-blue-800'}`}>{etiquetaEstado[estado]}{archivo && ` · v${archivo.version}`}</p>
        {estado === 'aprobado' && revision && <p className="text-xs">Aprobó {nombreDe(revision.aprobado_por)} · {fecha(revision.aprobado_en)}</p>}
        <div className="flex flex-wrap gap-2">
          {archivo && <button className={claseBotonSecundario} onClick={() => setSeleccionado(archivo.id)}>Previsualizar y revisar</button>}
          {abierto && puedePaso(3) && <label className={`${claseBotonSecundario} cursor-pointer`}>{subiendo === tipo ? 'Subiendo…' : 'Subir nueva versión'}<input type="file" className="hidden" accept={FORMATOS_ACEPTADOS} disabled={subiendo !== null} onChange={(e) => { subir(tipo, e.target.files[0]); e.target.value = ''; }} /></label>}
        </div>
        <details><summary className="text-sm cursor-pointer">Historial de versiones</summary><ul className="space-y-2 mt-2">{archivos.filter((a) => a.tipo === tipo && a.paso === 3).sort((a, b) => b.version - a.version).map((a) => <li key={a.id} className="text-xs"><button className="underline text-blue-800 break-all" onClick={() => setSeleccionado(a.id)}>v{a.version} · {a.nombre}</button> · {nombreDe(a.subido_por)}</li>)}</ul></details>
      </section>;
    })}</div>
    {archivos.filter((a) => a.tipo === 'comentarios_externos').map((a) => <button key={a.id} className={claseBotonSecundario} onClick={() => setSeleccionado(a.id)}>Ver respaldo de comentarios externos</button>)}
    {seleccionadoActual && <PrevisualizarDocumento archivo={seleccionadoActual} prospecto={prospecto} cerrar={() => setSeleccionado(null)} onCambio={onCambio} />}
  </div>;
}
