import { BLOQUES_EVIDENCIA, ESTADOS_EVIDENCIA, ESTADOS_CONTACTO, urlSegura } from '../../../../lib/radarFicha.mjs';

export function EnlaceFicha({ href, children }) {
  const segura = urlSegura(href);
  return segura ? <a href={segura} target="_blank" rel="noopener noreferrer" className="font-semibold text-[rgb(53,92,143)] underline underline-offset-2">{children}</a> : null;
}
const fecha = (valor) => valor ? new Date(`${valor}T12:00:00`).toLocaleDateString('es-CO') : 'Sin fecha';
const Dato = ({ titulo, valor, resumen }) => <div className="min-w-0"><dt className="font-bold text-gray-500">{titulo}</dt><dd className={`mt-1 whitespace-pre-line break-words text-gray-700 ${resumen ? 'line-clamp-3' : ''}`}>{valor || 'Pendiente de completar'}</dd></div>;

/** Shared read-only introduction, for candidates and the selected prospect. */
export default function RadarFichaEmpresa({ prospecto: p }) {
  const resumen = <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
    <Dato titulo="Qué hace" valor={p.que_hace} resumen />
    <Dato titulo={`Qué pasó · Señal${p.senal_fecha ? ` · ${fecha(p.senal_fecha)}` : ''}`} valor={p.senal} resumen />
    <Dato titulo="Por qué investigarla · Hipótesis" valor={p.por_que_ahora} resumen />
    <Dato titulo="Servicio principal por explorar" valor={p.servicio_principal} resumen />
  </dl>;
  return <div className="min-w-0 space-y-4">
    <div className="text-sm text-gray-500">
      <p className="break-words">{[p.sector, p.ciudad, p.pais].filter(Boolean).join(' · ')}</p>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        <EnlaceFicha href={p.sitio_web}>{p.tipo_sitio_web === 'web' ? 'Sitio web' : p.tipo_sitio_web === 'linkedin' ? 'LinkedIn de empresa' : 'Enlace registrado'}</EnlaceFicha>
        <EnlaceFicha href={p.linkedin_empresa}>LinkedIn de empresa</EnlaceFicha>
      </div>
    </div>
    {resumen}
    <details className="group rounded-xl border border-gray-200 bg-gray-50 p-3">
      <summary className="cursor-pointer text-sm font-bold text-[rgb(53,92,143)] focus-visible:outline focus-visible:outline-2"><span className="group-open:hidden">Ver ficha</span><span className="hidden group-open:inline">Ocultar ficha</span></summary>
      <div className="mt-4 space-y-5 text-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato titulo="Qué hace" valor={p.que_hace} />
          <Dato titulo="Cómo opera" valor={p.como_opera} />
          <Dato titulo="Tamaño y estructura" valor={p.tamano_estructura} />
          <Dato titulo="Países de operación" valor={p.paises_operacion} />
          <Dato titulo="Qué pasó · Señal" valor={p.senal} />
          <div><dt className="font-bold text-gray-500">Fecha y fuente de la señal</dt><dd className="mt-1 flex flex-wrap gap-2">{fecha(p.senal_fecha)} <EnlaceFicha href={p.senal_fuente}>Consultar fuente</EnlaceFicha></dd></div>
          <Dato titulo="Por qué investigarla · Hipótesis comercial" valor={p.por_que_ahora} />
          <Dato titulo="Servicio principal por explorar" valor={p.servicio_principal} />
          <Dato titulo="Justificación y otros servicios posibles" valor={p.servicios} />
          <Dato titulo="Qué falta validar" valor={p.pendientes_validar} />
        </dl>
        <p className="text-xs text-gray-500">La hipótesis comercial es una posibilidad por explorar. Registrar una fuente no equivale a aprobación del equipo ni confirma intención de compra.</p>
        <div><h3 className="font-bold text-gray-600">Con quién conversar</h3>
          {!p.contactos?.length ? <p className="mt-1 text-gray-500">Sin contactos registrados.</p> : <ul className="mt-2 space-y-3">{p.contactos.map((c, i) => <li key={i} className="min-w-0 break-words rounded-lg border bg-white p-3"><p className="font-semibold">{c.nombre}</p><p>{c.cargo || 'Cargo por validar'}</p><p className="text-xs text-gray-500">{ESTADOS_CONTACTO[c.estado] || 'Por validar'}</p><EnlaceFicha href={c.linkedin}>LinkedIn del contacto</EnlaceFicha></li>)}</ul>}
        </div>
        <div><h3 className="font-bold text-gray-600">Fuentes y estado de los datos</h3><p className="mt-1 text-xs text-gray-500">Investigación: {fecha(p.investigado_el)}. Los datos sin evidencia registrada quedan por validar.</p>
          {!p.evidencias?.length ? <p className="mt-2 text-gray-500">Sin evidencias estructuradas. Los textos y enlaces anteriores se conservan completos.</p> : <ul className="mt-2 space-y-3">{p.evidencias.map((e, i) => <li key={i} className="min-w-0 break-words rounded-lg border bg-white p-3"><p className="font-semibold">{BLOQUES_EVIDENCIA[e.bloque]} · {ESTADOS_EVIDENCIA[e.estado]}</p><p>{e.nombre}</p><EnlaceFicha href={e.enlace}>Consultar fuente</EnlaceFicha><p className="text-xs text-gray-500">Consulta: {fecha(e.fecha_consulta)}</p></li>)}</ul>}
        </div>
      </div>
    </details>
  </div>;
}
