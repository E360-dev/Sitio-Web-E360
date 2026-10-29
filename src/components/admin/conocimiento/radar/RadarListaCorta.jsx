import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  obtenerProspectos,
  elegirProspecto,
  actualizarProspecto,
  eliminarCandidato,
  formatoFecha,
  viernesDeLista,
} from '../../../../lib/radarApi';
import { useRadar, RADAR } from './RadarComercial.jsx';
import RadarFormularioFicha from './RadarFormularioFicha.jsx';
import RadarFichaEmpresa from './RadarFichaEmpresa.jsx';
import { Tarjeta, Vacio, claseBoton, claseBotonSecundario } from './RadarUi.jsx';

const Candidato = ({ p, puedeElegir, puedeEditar, listaActualCerrada, onCambio }) => {
  const navigate = useNavigate();
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState(false);

  const accion = async (fn, mensaje) => {
    setOcupado(true);
    try {
      await fn();
      if (mensaje) toast.success(mensaje);
      onCambio();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOcupado(false);
    }
  };

  const elegir = () => {
    if (!window.confirm(`¿Elegir ${p.empresa}? Se calcularán las fechas de todos los pasos y la lista se cerrará: los demás candidatos quedarán como no elegidos.`)) return;
    accion(async () => {
      await elegirProspecto(p.id);
      navigate(`${RADAR}/prospecto/${p.id}`);
    }, 'Prospecto elegido. Ya corre su calendario.');
  };

  return (
    <li className="min-w-0 rounded-xl border border-gray-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full break-words">
          <p className="text-lg font-black text-[#1a2f4e]">{p.empresa}</p>
          {p.score != null && <p className="text-sm font-bold text-[#25c6e3]">Score {p.score}</p>}
          {p.estado === 'no_elegido' && <p className="text-xs text-gray-400">De la lista del {formatoFecha(p.fecha_lista)}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeElegir && p.estado === 'candidato' && (
            <>
              <button className={claseBoton} disabled={ocupado || editando} onClick={elegir}>Elegir</button>
              <button
                className={claseBotonSecundario}
                disabled={ocupado || editando}
                onClick={() => accion(() => actualizarProspecto(p.id, { estado: 'no_elegido' }))}
              >
                No elegido
              </button>
            </>
          )}
          {puedeElegir && p.estado === 'no_elegido' && (
            // Vuelve con la fecha de la lista actual para que su calendario no nazca atrasado.
            <button
              className={claseBotonSecundario}
              disabled={ocupado || editando || listaActualCerrada}
              title={listaActualCerrada ? 'La lista de este viernes ya tiene un prospecto elegido' : 'Lo publica en la lista de este viernes'}
              onClick={() =>
                accion(
                  () => actualizarProspecto(p.id, { estado: 'candidato', fecha_lista: viernesDeLista() }),
                  'Regresó a la lista corta.',
                )
              }
            >
              Recuperar
            </button>
          )}
          {puedeEditar && (
            <details className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <summary className="cursor-pointer font-semibold text-gray-600">Más opciones<span className="sr-only"> de {p.empresa}</span></summary>
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" className="font-bold text-[rgb(53,92,143)]" disabled={ocupado || editando} onClick={() => setEditando(true)}>Editar ficha</button>
                <button type="button" className="font-bold text-red-600" disabled={ocupado || editando} onClick={() => window.confirm(`¿Eliminar ${p.empresa}?`) && accion(() => eliminarCandidato(p.id), 'Candidato eliminado.')}>Eliminar</button>
              </div>
            </details>
          )}
        </div>
      </div>
      <div className="mt-4">
        {editando ? <RadarFormularioFicha prospecto={p} onCancelar={() => setEditando(false)} onGuardado={() => { setEditando(false); onCambio(); }} /> : <RadarFichaEmpresa prospecto={p} />}
      </div>
    </li>
  );
};

export default function RadarListaCorta() {
  const { puedePaso } = useRadar();
  const [todos, setTodos] = useState(null);
  const [verNoElegidos, setVerNoElegidos] = useState(false);

  const cargar = useCallback(() => {
    obtenerProspectos()
      .then(setTodos)
      .catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!todos) return <p className="text-gray-400">Cargando la lista corta…</p>;

  const prospectos = todos.filter((p) => ['candidato', 'no_elegido'].includes(p.estado));
  // Una lista con un prospecto elegido queda cerrada: solo se elige uno por lista.
  const cerradas = Object.fromEntries(
    todos.filter((p) => !['candidato', 'no_elegido'].includes(p.estado)).map((p) => [p.fecha_lista, p.empresa]),
  );
  const listaActualCerrada = Boolean(cerradas[viernesDeLista()]);

  const candidatos = prospectos.filter((p) => p.estado === 'candidato');
  const noElegidos = prospectos.filter((p) => p.estado === 'no_elegido');

  // Agrupados por el viernes de la lista.
  const porLista = candidatos.reduce((grupos, p) => {
    (grupos[p.fecha_lista] ||= []).push(p);
    return grupos;
  }, {});

  return (
    <div className="space-y-6">
      {puedePaso(1) && (
        <Tarjeta titulo="Paso 1 · Agregar candidato">
          <details>
            <summary className="cursor-pointer text-sm font-bold text-[rgb(53,92,143)]">Preparar candidato</summary>
            <div className="mt-4"><RadarFormularioFicha onGuardado={cargar} /></div>
          </details>
        </Tarjeta>
      )}

      {Object.keys(porLista).length === 0 ? (
        <Tarjeta titulo="Lista corta">
          <Vacio>No hay candidatos esperando elección.</Vacio>
        </Tarjeta>
      ) : (
        Object.entries(porLista).map(([fecha, lista]) => (
          <Tarjeta key={fecha} titulo={`Lista del ${formatoFecha(fecha)}${cerradas[fecha] ? ' · cerrada' : ''}`}>
            {cerradas[fecha] && (
              <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                En esta lista ya se eligió {cerradas[fecha]}. Solo se elige un prospecto por lista.
              </p>
            )}
            <ul className="space-y-4">
              {lista.map((p) => (
                <Candidato
                  key={p.id}
                  p={p}
                  puedeElegir={puedePaso(2) && !cerradas[fecha]}
                  puedeEditar={puedePaso(1)}
                  listaActualCerrada={listaActualCerrada}
                  onCambio={cargar}
                />
              ))}
            </ul>
          </Tarjeta>
        ))
      )}

      {noElegidos.length > 0 && (
        <Tarjeta
          titulo={`No elegidos (${noElegidos.length})`}
          accion={
            <button className="text-sm font-bold text-[rgb(53,92,143)]" onClick={() => setVerNoElegidos(!verNoElegidos)}>
              {verNoElegidos ? 'Ocultar' : 'Mostrar'}
            </button>
          }
        >
          {verNoElegidos ? (
            <ul className="space-y-4">
              {noElegidos.map((p) => (
                <Candidato
                  key={p.id}
                  p={p}
                  puedeElegir={puedePaso(2)}
                  puedeEditar={puedePaso(1)}
                  listaActualCerrada={listaActualCerrada}
                  onCambio={cargar}
                />
              ))}
            </ul>
          ) : (
            <Vacio>Quedan guardados por si vuelven a otra lista.</Vacio>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
