import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import {
  obtenerProspectos,
  crearCandidato,
  elegirProspecto,
  actualizarProspecto,
  eliminarCandidato,
  formatoFecha,
  viernesDeLista,
} from '../../../../lib/radarApi';
import { useRadar, RADAR } from './RadarComercial.jsx';
import { Tarjeta, Vacio, claseBoton, claseBotonSecundario, claseCampo } from './RadarUi.jsx';

const VACIO = { empresa: '', sector: '', sitio_web: '', score: '', senal: '', por_que_ahora: '', servicios: '' };

const FormularioCandidato = ({ onCreado }) => {
  const [datos, setDatos] = useState(VACIO);
  const [fecha, setFecha] = useState(viernesDeLista());
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await crearCandidato({
        ...datos,
        score: datos.score === '' ? null : Number(datos.score),
        fecha_lista: fecha,
      });
      toast.success('Candidato agregado a la lista corta.');
      setDatos(VACIO);
      onCreado();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <label className="md:col-span-3 text-sm font-bold text-gray-600">
        Empresa
        <input className={`${claseCampo} mt-1`} value={datos.empresa} onChange={cambiar('empresa')} required />
      </label>
      <label className="md:col-span-1 text-sm font-bold text-gray-600">
        Score
        <input type="number" min="0" className={`${claseCampo} mt-1`} value={datos.score} onChange={cambiar('score')} />
      </label>
      <label className="md:col-span-2 text-sm font-bold text-gray-600">
        Lista del viernes
        <input type="date" className={`${claseCampo} mt-1`} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      </label>
      <label className="md:col-span-3 text-sm font-bold text-gray-600">
        Sector
        <input className={`${claseCampo} mt-1`} value={datos.sector} onChange={cambiar('sector')} placeholder="Ej. Salud, tecnología, financiero" />
      </label>
      <label className="md:col-span-3 text-sm font-bold text-gray-600">
        Sitio web o LinkedIn
        <input type="url" className={`${claseCampo} mt-1`} value={datos.sitio_web} onChange={cambiar('sitio_web')} placeholder="https://" />
      </label>
      <label className="md:col-span-6 text-sm font-bold text-gray-600">
        Señal
        <textarea rows={2} className={`${claseCampo} mt-1`} value={datos.senal} onChange={cambiar('senal')} required />
      </label>
      <label className="md:col-span-3 text-sm font-bold text-gray-600">
        Por qué es buen momento
        <textarea rows={2} className={`${claseCampo} mt-1`} value={datos.por_que_ahora} onChange={cambiar('por_que_ahora')} required />
      </label>
      <label className="md:col-span-3 text-sm font-bold text-gray-600">
        Servicios a ofrecer
        <textarea rows={2} className={`${claseCampo} mt-1`} value={datos.servicios} onChange={cambiar('servicios')} required />
      </label>
      <div className="md:col-span-6 flex justify-end">
        <button type="submit" className={claseBoton} disabled={guardando}>
          <PlusIcon className="h-4 w-4" /> {guardando ? 'Guardando…' : 'Agregar a la lista corta'}
        </button>
      </div>
    </form>
  );
};

const Candidato = ({ p, puedeElegir, puedeEditar, onCambio }) => {
  const navigate = useNavigate();
  const [ocupado, setOcupado] = useState(false);

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
    if (!window.confirm(`¿Elegir ${p.empresa}? Se calcularán las fechas de todos los pasos.`)) return;
    accion(async () => {
      await elegirProspecto(p.id);
      navigate(`${RADAR}/prospecto/${p.id}`);
    }, 'Prospecto elegido. Ya corre su calendario.');
  };

  return (
    <li className="rounded-xl border border-gray-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-[#1a2f4e]">{p.empresa}</p>
          {p.sector && <p className="text-sm text-gray-500">Sector: {p.sector}</p>}
          {p.sitio_web && <a href={p.sitio_web} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[rgb(53,92,143)] hover:underline">Sitio web / LinkedIn</a>}
          {p.score != null && <p className="text-sm font-bold text-[#25c6e3]">Score {p.score}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeElegir && p.estado === 'candidato' && (
            <>
              <button className={claseBoton} disabled={ocupado} onClick={elegir}>Elegir</button>
              <button
                className={claseBotonSecundario}
                disabled={ocupado}
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
              disabled={ocupado}
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
            <button
              className="text-sm font-bold text-red-500 hover:text-red-700 px-2"
              disabled={ocupado}
              onClick={() => window.confirm(`¿Eliminar ${p.empresa}?`) && accion(() => eliminarCandidato(p.id), 'Candidato eliminado.')}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div><dt className="font-bold text-gray-500">Señal</dt><dd className="text-gray-700 whitespace-pre-line">{p.senal || '—'}</dd></div>
        <div><dt className="font-bold text-gray-500">Por qué ahora</dt><dd className="text-gray-700 whitespace-pre-line">{p.por_que_ahora || '—'}</dd></div>
        <div><dt className="font-bold text-gray-500">Servicios</dt><dd className="text-gray-700 whitespace-pre-line">{p.servicios || '—'}</dd></div>
      </dl>
    </li>
  );
};

export default function RadarListaCorta() {
  const { puedePaso } = useRadar();
  const [prospectos, setProspectos] = useState(null);
  const [verNoElegidos, setVerNoElegidos] = useState(false);

  const cargar = useCallback(() => {
    obtenerProspectos()
      .then((todos) => setProspectos(todos.filter((p) => ['candidato', 'no_elegido'].includes(p.estado))))
      .catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!prospectos) return <p className="text-gray-400">Cargando la lista corta…</p>;

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
          <FormularioCandidato onCreado={cargar} />
        </Tarjeta>
      )}

      {Object.keys(porLista).length === 0 ? (
        <Tarjeta titulo="Lista corta">
          <Vacio>No hay candidatos esperando elección.</Vacio>
        </Tarjeta>
      ) : (
        Object.entries(porLista).map(([fecha, lista]) => (
          <Tarjeta key={fecha} titulo={`Lista del ${formatoFecha(fecha)}`}>
            <ul className="space-y-4">
              {lista.map((p) => (
                <Candidato key={p.id} p={p} puedeElegir={puedePaso(2)} puedeEditar={puedePaso(1)} onCambio={cargar} />
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
                <Candidato key={p.id} p={p} puedeElegir={puedePaso(2)} puedeEditar={puedePaso(1)} onCambio={cargar} />
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
