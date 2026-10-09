import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { obtenerProspectos, pasoActual, formatoFecha, hoyISO, ESTADOS } from '../../../../lib/radarApi';
import { useRadar, RADAR } from './RadarComercial.jsx';
import { Semaforo, Tarjeta, Vacio } from './RadarUi.jsx';

const ACTIVOS = ['en_curso', 'enviado', 'en_seguimiento'];

/** Lunes y viernes de la semana en curso (ISO). */
const semanaActual = () => {
  const hoy = new Date(`${hoyISO()}T12:00:00`);
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);
  return [lunes.toISOString().slice(0, 10), viernes.toISOString().slice(0, 10)];
};

export default function RadarProspectos() {
  const { pasos, puedePaso, responsablesDe } = useRadar();
  const [prospectos, setProspectos] = useState(null);
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    obtenerProspectos()
      .then(setProspectos)
      .catch((e) => {
        toast.error(e.message);
        setProspectos([]);
      });
  }, []);

  const nombrePaso = (n) => pasos.find((p) => p.paso === n)?.nombre || `Paso ${n}`;

  const { pendientes, semana, lista, candidatos } = useMemo(() => {
    if (!prospectos) return { pendientes: [], semana: [], lista: [], candidatos: 0 };
    const enCurso = prospectos.filter((p) => ACTIVOS.includes(p.estado));
    const [lunes, viernes] = semanaActual();

    const conActual = enCurso.map((p) => ({ ...p, actual: pasoActual(p.radar_hitos) }));

    return {
      pendientes: conActual
        .filter((p) => p.actual && puedePaso(p.actual.paso))
        .sort((a, b) => a.actual.fecha_compromiso.localeCompare(b.actual.fecha_compromiso)),
      // Lo que vence esta semana o ya venció, en todos los prospectos.
      semana: conActual
        .flatMap((p) =>
          p.radar_hitos
            .filter((h) => !h.fecha_real && h.fecha_compromiso <= viernes)
            .map((h) => ({ prospecto: p, hito: h, vencido: h.fecha_compromiso < lunes })),
        )
        .sort((a, b) => a.hito.fecha_compromiso.localeCompare(b.hito.fecha_compromiso)),
      lista: (verTodos
        ? prospectos.filter((p) => !['candidato', 'no_elegido'].includes(p.estado))
        : enCurso
      ).map((p) => ({ ...p, actual: pasoActual(p.radar_hitos) })),
      candidatos: prospectos.filter((p) => p.estado === 'candidato').length,
    };
  }, [prospectos, verTodos, puedePaso]);

  if (!prospectos) return <p className="text-gray-400">Cargando prospectos…</p>;

  return (
    <div className="space-y-6">
      <Tarjeta titulo="Mis pendientes">
        {puedePaso(2) && candidatos > 0 && (
          <Link
            to={`${RADAR}/lista-corta`}
            className="mb-3 flex items-center justify-between gap-4 rounded-xl bg-[#25c6e3]/10 px-4 py-3 hover:bg-[#25c6e3]/20"
          >
            <span className="font-bold text-[#1a2f4e]">Elegir el prospecto de la lista corta</span>
            <span className="text-sm text-gray-500">{candidatos} candidato{candidatos === 1 ? '' : 's'}</span>
          </Link>
        )}
        {pendientes.length === 0 && !(puedePaso(2) && candidatos > 0) ? (
          <Vacio>No tienes pasos pendientes.</Vacio>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pendientes.map((p) => (
              <li key={p.id}>
                <Link to={`${RADAR}/prospecto/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-gray-50 rounded-lg px-2">
                  <div>
                    <p className="font-bold text-[#1a2f4e]">{p.empresa}</p>
                    <p className="text-sm text-gray-500">
                      Paso {p.actual.paso}: {nombrePaso(p.actual.paso)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {formatoFecha(p.actual.fecha_compromiso)}
                    <Semaforo hito={p.actual} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta titulo="Esta semana">
        {semana.length === 0 ? (
          <Vacio>Nada vence esta semana.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Prospecto</th>
                  <th className="py-2 pr-4">Paso</th>
                  <th className="py-2 pr-4">Quién</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {semana.map(({ prospecto, hito }) => (
                  <tr key={`${prospecto.id}-${hito.paso}`}>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatoFecha(hito.fecha_compromiso)}</td>
                    <td className="py-2 pr-4">
                      <Link to={`${RADAR}/prospecto/${prospecto.id}`} className="font-bold text-[rgb(53,92,143)] hover:underline">
                        {prospecto.empresa}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{hito.paso}. {nombrePaso(hito.paso)}</td>
                    <td className="py-2 pr-4">{responsablesDe(hito.paso)}</td>
                    <td className="py-2"><Semaforo hito={hito} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Prospectos"
        accion={
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input type="checkbox" checked={verTodos} onChange={(e) => setVerTodos(e.target.checked)} />
            Ver también cerrados y descartados
          </label>
        }
      >
        {lista.length === 0 ? (
          <Vacio>
            Todavía no hay prospectos en curso. Se crean al elegir uno de la{' '}
            <Link to={`${RADAR}/lista-corta`} className="font-bold text-[rgb(53,92,143)]">lista corta</Link>.
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-4">Empresa</th>
                  <th className="py-2 pr-4">Va en</th>
                  <th className="py-2 pr-4">Quién lo tiene</th>
                  <th className="py-2 pr-4">Compromiso</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2">Rondas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <Link to={`${RADAR}/prospecto/${p.id}`} className="font-bold text-[rgb(53,92,143)] hover:underline">
                        {p.empresa}
                      </Link>
                      {p.sector && <p className="text-xs text-gray-500">Sector: {p.sector}</p>}
                      {p.sitio_web && <a href={p.sitio_web} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[rgb(53,92,143)] hover:underline">Sitio web / LinkedIn</a>}
                      <p className="text-xs text-gray-400">{ESTADOS[p.estado]}</p>
                    </td>
                    <td className="py-3 pr-4">
                      {p.actual ? `${p.actual.paso}/9 · ${nombrePaso(p.actual.paso)}` : 'Flujo completo'}
                    </td>
                    <td className="py-3 pr-4">{p.actual ? responsablesDe(p.actual.paso) : '—'}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{p.actual ? formatoFecha(p.actual.fecha_compromiso) : '—'}</td>
                    <td className="py-3 pr-4"><Semaforo hito={p.actual} /></td>
                    <td className="py-3">{p.rondas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
