import { useRadar } from './RadarComercial.jsx';
import { Tarjeta } from './RadarUi.jsx';

// El flujo se lee de radar_pasos, la misma tabla que usa el sistema para
// calcular fechas, así que esta página no se desfasa de lo que se exige.
export default function RadarFlujo() {
  const { pasos, responsablesDe } = useRadar();

  return (
    <div className="space-y-6">
      <Tarjeta titulo="Cómo funciona">
        <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
          <li>Cada viernes sale una lista corta. Al elegir un prospecto el lunes, el sistema calcula la fecha compromiso de cada paso en días hábiles.</li>
          <li>Cada persona solo puede cerrar los pasos que tiene asignados, y en orden.</li>
          <li>Si un paso se atrasa, la fecha compromiso no se mueve: se marca el retraso. Así sabemos dónde se pierde el tiempo.</li>
          <li>Los documentos se suben al prospecto y nada se reemplaza: cada corrección queda como versión nueva.</li>
          <li>El ciclo dura unas dos semanas, así que normalmente hay dos prospectos en curso al mismo tiempo.</li>
        </ul>
      </Tarjeta>

      <ol className="relative space-y-4 border-l-2 border-[#25c6e3]/40 ml-4">
        {pasos.map((p) => (
          <li key={p.paso} className="ml-8">
            <span className="absolute -left-[17px] flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(53,92,143)] text-sm font-black text-white">
              {p.paso}
            </span>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-black text-[#1a2f4e]">{p.nombre}</h3>
                <span className="text-sm font-bold text-[#25c6e3]">{p.dia}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-500">Responsable: {responsablesDe(p.paso)}</p>
              <p className="mt-3 text-sm text-gray-700">
                <span className="font-bold">Entregable:</span> {p.entregable}
              </p>
              {p.como && <p className="mt-2 text-sm text-gray-500">{p.como}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
