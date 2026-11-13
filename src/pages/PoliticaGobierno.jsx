import { Link, useParams } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowRightIcon, ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Seo from '../components/Seo';
import NotFoundPage from './NotFoundPage';
import datos from '../datos/gobierno.json';
import { IconoGobierno, RutaGobierno, EstadoDocumento, useFocoGobierno } from '../components/gobierno/GobiernoUI';

export default function PoliticaGobierno() {
  const { slug } = useParams();
  const titulo = useFocoGobierno();
  const indice = datos.politicas.findIndex((p) => p.slug === slug);
  if (indice < 0) return <NotFoundPage />;
  const politica = datos.politicas[indice];
  const siguiente = datos.politicas[(indice + 1) % datos.politicas.length];
  return <main className="gobierno-page pt-20">
    <Seo title={`${politica.titulo} | Gobierno de la firma | E360`} description={politica.resumen} path={`/gobierno/${slug}`} />
    <a href="#lectura-politica" className="gobierno-skip">Ir al contenido de la política</a>
    <header className="gobierno-hero gobierno-hero-policy">
      <div className="gobierno-container relative z-10">
        <RutaGobierno titulo={politica.titulo} />
        <div className="pb-12 pt-10 sm:pb-16">
          <p className="gobierno-eyebrow">Gobierno de la firma · 0{indice + 1} / 07</p>
          <div className="mt-5 flex items-start gap-5"><span className="hidden rounded-2xl border border-white/20 p-4 text-e360-cyan sm:block"><IconoGobierno nombre={politica.icono} className="h-8 w-8" /></span><h1 ref={titulo} tabIndex={-1} className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{politica.titulo}</h1></div>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">{politica.introduccion}</p>
        </div>
      </div>
    </header>
    <div className="gobierno-container grid items-start gap-10 py-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16 lg:py-16">
      <aside className="lg:sticky lg:top-28">
        <nav aria-label="En esta política" className="gobierno-toc">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-e360-primary">En esta política</p>
          <ol className="space-y-1">{politica.apartados.map((apartado, i) => <li key={apartado.id}><a href={`#${apartado.id}`}><span aria-hidden="true" className="text-slate-400">0{i + 1}</span><span>{apartado.titulo}</span></a></li>)}</ol>
        </nav>
        <Link to="/gobierno" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-e360-primary"><ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />Todas las políticas</Link>
      </aside>
      <article id="lectura-politica" className="min-w-0">
        <div className="mb-9 border-b border-slate-200 pb-6"><EstadoDocumento datos={datos} /></div>
        <div className="gobierno-prose">
          {politica.apartados.map((apartado, i) => <section key={apartado.id} id={apartado.id} aria-labelledby={`titulo-${apartado.id}`}>
            <div className="mb-5 flex items-baseline gap-3"><span aria-hidden="true" className="text-xs font-semibold text-e360-primary/60">0{i + 1}</span><h2 id={`titulo-${apartado.id}`}>{apartado.titulo}</h2></div>
            {apartado.parrafos.map((parrafo, n) => <p key={n}>{parrafo}</p>)}
            {apartado.id === 'responsabilidades' && politica.consultas.length > 0 && <ul>{politica.consultas.map((consulta) => <li key={consulta.url}><a href={consulta.url}>{consulta.titulo}</a></li>)}</ul>}
            {apartado.id === 'documentos' && <div className="gobierno-download not-prose">
              <DocumentTextIcon aria-hidden="true" className="h-8 w-8 shrink-0 text-e360-primary" />
              <div className="min-w-0 flex-1"><h3 className="font-bold text-e360-dark">{politica.titulo}</h3><p className="mt-1 text-sm text-slate-600">Documento de consulta · PDF · v{politica.documento.version}</p><a href={politica.documento.ruta} download className="gobierno-download-link mt-4 inline-flex items-center gap-2 text-sm font-bold text-e360-primary">Descargar PDF <ArrowDownTrayIcon aria-hidden="true" className="h-4 w-4" /></a></div>
            </div>}
          </section>)}
        </div>
        <nav aria-label="Otras políticas" className="mt-12 flex flex-col gap-6 border-t border-slate-200 pt-8 sm:flex-row sm:items-start sm:justify-between">
          <Link to="/gobierno" className="inline-flex items-center gap-2 text-sm font-semibold text-e360-primary"><ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />Todas las políticas</Link>
          <Link to={`/gobierno/${siguiente.slug}`} className="max-w-sm text-sm text-e360-primary sm:text-right"><span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Siguiente tema</span><span className="inline-flex items-center gap-3 font-bold">{siguiente.titulo}<ArrowRightIcon aria-hidden="true" className="h-4 w-4 shrink-0" /></span></Link>
        </nav>
      </article>
    </div>
  </main>;
}
