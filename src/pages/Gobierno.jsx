import { Link } from 'react-router-dom';
import { ArrowRightIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import Seo from '../components/Seo';
import datos from '../datos/gobierno.json';
import { IconoGobierno, RutaGobierno, EstadoDocumento, useFocoGobierno } from '../components/gobierno/GobiernoUI';

export default function Gobierno() {
  const titulo = useFocoGobierno();
  return <main className="gobierno-page pt-20" id="contenido-gobierno">
    <Seo title="Gobierno de la firma | E360" description="Conoce los principios y políticas de E360: gobierno, ética, calidad profesional, privacidad, personas, sustentabilidad y relación con proveedores." path="/gobierno" />
    <a href="#politicas" className="gobierno-skip">Ir a las políticas</a>
    <header className="gobierno-hero">
      <div className="gobierno-container relative z-10">
        <RutaGobierno />
        <div className="grid items-end gap-10 pb-14 pt-10 lg:grid-cols-[1.5fr_1fr] lg:pb-20 lg:pt-16">
          <div>
            <p className="gobierno-eyebrow">Nuestro marco institucional</p>
            <h1 ref={titulo} tabIndex={-1} className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Gobierno<br className="hidden sm:block" /> de la firma<span className="text-e360-cyan">.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">Los principios que orientan nuestras decisiones y la forma en que trabajamos con clientes, personas y aliados.</p>
            <a href="#politicas" className="mt-8 inline-flex items-center gap-3 font-semibold text-white underline decoration-e360-cyan decoration-2 underline-offset-8">Explorar nuestras políticas <ArrowDownIcon aria-hidden="true" className="h-4 w-4" /></a>
          </div>
          <div className="border-l-2 border-e360-cyan/70 pl-6 lg:mb-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-e360-cyan">Claridad · Confianza · Rigor</p>
            <p className="mt-4 max-w-sm text-base leading-7 text-slate-200">Responsabilidades claras, juicio profesional y cuidado de la información en cada relación y servicio.</p>
          </div>
        </div>
      </div>
    </header>
    <section id="politicas" aria-labelledby="politicas-titulo" className="gobierno-container py-14 sm:py-20">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="gobierno-eyebrow text-e360-primary">Principios en práctica</p><h2 id="politicas-titulo" className="mt-3 text-3xl font-bold tracking-tight text-e360-dark">Un marco común, siete materias</h2></div>
        <p className="max-w-sm text-sm leading-6 text-slate-600">Consulta el alcance, los compromisos y la aplicación de cada política.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {datos.politicas.map((politica, i) => <article key={politica.slug} className="gobierno-card">
          <div className="mb-7 flex items-start justify-between"><span className="gobierno-icon"><IconoGobierno nombre={politica.icono} /></span><span aria-hidden="true" className="text-xs font-semibold tracking-widest text-slate-400">0{i + 1}</span></div>
          <h3 className="text-xl font-bold leading-snug tracking-tight text-e360-dark">{politica.titulo}</h3>
          <p className="mb-8 mt-4 flex-1 text-sm leading-7 text-slate-600">{politica.resumen}</p>
          <Link to={`/gobierno/${politica.slug}`} className="gobierno-card-link" aria-label={`Conocer más sobre ${politica.titulo}`}>Conocer más <ArrowRightIcon aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        </article>)}
        <aside className="gobierno-marco md:col-span-2 xl:col-span-2">
          <p className="gobierno-eyebrow text-e360-primary">Alcance y responsabilidad</p>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-e360-dark">Una forma de trabajar que se puede explicar.</h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Este marco comprende a la firma y a las personas vinculadas con ella, según su función, relación y obligaciones. Las políticas consideran la naturaleza de cada servicio y preservan la responsabilidad profesional de quienes toman las decisiones.</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Los documentos de consulta identifican su versión y alcance. Los expedientes, datos personales y registros reservados se mantienen en sus repositorios de acceso restringido.</p>
        </aside>
      </div>
      <div className="mt-12 border-t border-slate-200 pt-6"><EstadoDocumento datos={datos} /></div>
    </section>
  </main>;
}
