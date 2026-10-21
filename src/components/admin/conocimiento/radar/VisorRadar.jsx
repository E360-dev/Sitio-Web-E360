import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import DOMPurify from 'dompurify';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { supabase } from '../../../../lib/supabaseClient';

// Bundled worker: no third-party viewer receives documents or signed URLs.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export function sanearDocx(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','div','span','br','strong','b','em','i','u','s','h1','h2','h3','h4','h5','h6','ul','ol','li','table','thead','tbody','tr','td','th','blockquote','sup','sub','hr'],
    ALLOWED_ATTR: ['colspan','rowspan'],
  });
}

function Contenido({ archivo }) {
  const [estado, setEstado] = useState({ cargando: true });
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [ancho, setAncho] = useState(600);
  const marco = useRef(null);
  const extension = archivo.nombre.split('.').pop().toLowerCase();
  const soportado = ['pdf','docx','png','jpg','jpeg'].includes(extension);
  useEffect(() => {
    let vivo = true, objeto;
    setEstado({ cargando: true }); setPagina(1); setPaginas(0);
    if (!soportado) { setEstado({ noSoportado: true }); return; }
    (async () => {
      const { data, error } = await supabase.storage.from('radar').download(archivo.ruta);
      if (error) throw new Error('No se pudo abrir el archivo. Comprueba tu acceso y conexión.');
      if (!vivo) return;
      if (extension === 'docx') {
        if (data.size > 20 * 1024 * 1024) throw new Error('Este Word es demasiado grande para la vista de lectura. Puedes descargarlo.');
        const { default: mammoth } = await import('mammoth/mammoth.browser');
        const resultado = await mammoth.convertToHtml({ arrayBuffer: await data.arrayBuffer() }, { externalFileAccess: false });
        if (vivo) setEstado({ html: sanearDocx(resultado.value) });
      } else {
        objeto = URL.createObjectURL(data);
        if (vivo) setEstado({ url: objeto }); else URL.revokeObjectURL(objeto);
      }
    })().catch((e) => { if (vivo) setEstado({ error: e.message }); });
    return () => { vivo = false; if (objeto) URL.revokeObjectURL(objeto); };
  }, [archivo.id, archivo.ruta, extension, soportado]);
  useEffect(() => {
    if (!marco.current) return;
    const observer = new ResizeObserver(([e]) => setAncho(Math.max(180, e.contentRect.width - 24)));
    observer.observe(marco.current); return () => observer.disconnect();
  }, []);
  return <div ref={marco} className="min-w-0 h-full overflow-auto bg-slate-100 p-3">
    {estado.cargando && <p role="status">Abriendo documento…</p>}
    {estado.error && <p role="alert" className="p-4 text-red-700">{estado.error}</p>}
    {estado.noSoportado && <p className="p-4">Este formato no tiene previsualización. Usa Descargar para abrirlo con su aplicación.</p>}
    {estado.html !== undefined && <div className="h-full min-h-80"><p className="text-xs mb-2">Vista de lectura; el formato puede diferir de Word.</p><iframe title="Vista de lectura del documento Word" sandbox="" referrerPolicy="no-referrer" className="w-full h-[calc(100%-2rem)] min-h-96 bg-white" srcDoc={`<!doctype html><html lang="es"><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><style>body{font:16px system-ui;line-height:1.6;padding:20px;overflow-wrap:anywhere}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #ddd;padding:8px}</style></head><body>${estado.html}</body></html>`} /></div>}
    {estado.url && extension === 'pdf' && <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 p-2 bg-white border rounded mb-3 text-sm">
        <button aria-label="Página anterior" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>←</button>
        <span>Página {pagina} de {paginas || '…'}</span>
        <button aria-label="Página siguiente" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>→</button>
        <label>Zoom <select aria-label="Zoom del documento" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>{[0.75,1,1.25,1.5,2].map((v) => <option key={v} value={v}>{v * 100}%</option>)}</select></label>
      </div>
      <Document file={estado.url} onLoadSuccess={({ numPages }) => setPaginas(numPages)} loading="Cargando PDF…" error="No se pudo leer este PDF. Puedes descargarlo.">
        <Page pageNumber={pagina} width={ancho * zoom} renderTextLayer renderAnnotationLayer={false} />
      </Document>
    </>}
    {estado.url && extension !== 'pdf' && <img src={estado.url} alt={archivo.nombre} className="max-w-full mx-auto" />}
  </div>;
}

export default function VisorRadar({ archivo, cerrar, children }) {
  const dialogo = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => { dialogo.current.showModal(); }, []);
  const descargar = async () => {
    setError('');
    const { data, error: fallo } = await supabase.storage.from('radar').download(archivo.ruta);
    if (fallo) { setError('No se pudo descargar el archivo.'); return; }
    const url = URL.createObjectURL(data); const link = document.createElement('a');
    link.href = url; link.download = archivo.nombre; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <dialog ref={dialogo} onCancel={(e) => { e.preventDefault(); cerrar(); }} className="w-[96vw] max-w-[1500px] h-[94dvh] max-h-[94dvh] rounded-2xl p-0 backdrop:bg-black/50">
    <div className="h-full flex flex-col min-w-0">
      <header className="flex flex-wrap items-center justify-between gap-2 p-4 border-b shrink-0">
        <h2 className="font-bold break-all min-w-0">v{archivo.version} · {archivo.nombre}</h2>
        <div className="flex gap-4 text-sm font-semibold"><button onClick={descargar}>Descargar</button><button aria-label="Cerrar previsualización" onClick={cerrar}>Cerrar ✕</button></div>
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </header>
      <div className={`min-h-0 flex-1 grid ${children ? 'grid-rows-[minmax(280px,1fr)_minmax(200px,0.8fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_360px]' : 'grid-cols-1'}`}>
        <Contenido key={archivo.id} archivo={archivo} />
        {children && <aside className="overflow-auto min-w-0 border-t lg:border-t-0 lg:border-l p-4">{children}</aside>}
      </div>
    </div>
  </dialog>;
}
