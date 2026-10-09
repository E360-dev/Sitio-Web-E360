import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import {
  obtenerProspecto,
  actualizarProspecto,
  completarPaso,
  registrarObservaciones,
  agregarComentario,
  moverFechaCompromiso,
  subirArchivo,
  urlTemporal,
  pasoActual,
  formatoFecha,
  hoyISO,
  ESTADOS,
  TIPOS_ARCHIVO,
  FORMATOS_ACEPTADOS,
} from '../../../../lib/radarApi';
import { useRadar, RADAR } from './RadarComercial.jsx';
import { Semaforo, Tarjeta, Vacio, claseBoton, claseBotonSecundario, claseCampo } from './RadarUi.jsx';

const fechaHora = (iso) =>
  new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// --- Archivos de un paso, con sus versiones ---

const Archivos = ({ prospecto, paso, archivos, puedeSubir, onCambio }) => {
  const { nombreDe } = useRadar();
  const [subiendo, setSubiendo] = useState(null);

  const subir = async (tipo, archivo, versionActual) => {
    if (!archivo) return;
    setSubiendo(tipo);
    try {
      await subirArchivo({ prospectoId: prospecto.id, paso, tipo, archivo, versionActual });
      toast.success('Archivo subido.');
      onCambio();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubiendo(null);
    }
  };

  const descargar = async (ruta) => {
    try {
      window.open(await urlTemporal(ruta), '_blank', 'noopener');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {TIPOS_ARCHIVO[paso].map(({ tipo, nombre }) => {
        const versiones = archivos.filter((a) => a.tipo === tipo).sort((a, b) => b.version - a.version);
        return (
          <div key={tipo} className={`rounded-xl border p-4 ${versiones.length ? 'border-gray-200' : 'border-dashed border-gray-300'}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#1a2f4e]">{nombre}</p>
              {puedeSubir && (
                <label className={`${claseBotonSecundario} cursor-pointer !px-2.5 !py-1 text-xs`}>
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {subiendo === tipo ? 'Subiendo…' : versiones.length ? 'Nueva versión' : 'Subir'}
                  <input
                    type="file"
                    className="hidden"
                    accept={FORMATOS_ACEPTADOS}
                    disabled={subiendo !== null}
                    onChange={(e) => {
                      subir(tipo, e.target.files[0], versiones[0]?.version || 0);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            {versiones.length === 0 ? (
              <p className="mt-2 text-xs text-gray-400">Sin archivo</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {versiones.map((a, i) => (
                  <li key={a.id} className={`flex items-center justify-between gap-2 text-xs ${i ? 'text-gray-400' : 'text-gray-700'}`}>
                    <span className="truncate">
                      <span className="font-black">v{a.version}</span> · {a.nombre} · {nombreDe(a.subido_por)}, {fechaHora(a.subido_en)}
                    </span>
                    <button onClick={() => descargar(a.ruta)} className="shrink-0 text-[rgb(53,92,143)] hover:text-[#1a2f4e]" title="Descargar">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Comentarios de un paso ---

const Comentarios = ({ prospecto, paso, comentarios, onCambio }) => {
  const { nombreDe } = useRadar();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await agregarComentario(prospecto.id, paso, texto.trim());
      setTexto('');
      onCambio();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setEnviando(false);
    }
  };

  const etiqueta = { observacion: 'Observaciones', visto_bueno: 'Visto bueno' };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {comentarios.length > 0 && (
        <ul className="space-y-2 mb-3">
          {comentarios.map((c) => (
            <li
              key={c.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                c.tipo === 'observacion' ? 'bg-amber-50' : c.tipo === 'visto_bueno' ? 'bg-emerald-50' : 'bg-gray-50'
              }`}
            >
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-600">{nombreDe(c.autor)}</span> · {fechaHora(c.creado_en)}
                {etiqueta[c.tipo] && <span className="ml-2 font-bold uppercase">{etiqueta[c.tipo]}</span>}
              </p>
              <p className="text-gray-700 whitespace-pre-line">{c.texto}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={enviar} className="flex gap-2">
        <input className={claseCampo} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un comentario…" />
        <button type="submit" className={claseBotonSecundario} disabled={enviando || !texto.trim()}>Comentar</button>
      </form>
    </div>
  );
};

// --- Contenido propio de cada paso ---

const Enfoque = ({ prospecto, editable, valores, setValores }) => {
  const campos = [
    ['enfoque_servicio', 'Servicio a ofrecer'],
    ['enfoque_angulo', 'Ángulo central'],
    ['enfoque_cuidar', 'Qué cuidar'],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {campos.map(([campo, nombre]) =>
        editable ? (
          <label key={campo} className="text-sm font-bold text-gray-600">
            {nombre}
            <textarea
              rows={4}
              className={`${claseCampo} mt-1`}
              value={valores[campo] ?? ''}
              onChange={(e) => setValores({ ...valores, [campo]: e.target.value })}
            />
          </label>
        ) : (
          <div key={campo}>
            <p className="text-sm font-bold text-gray-500">{nombre}</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{prospecto[campo] || '—'}</p>
          </div>
        ),
      )}
    </div>
  );
};

const Paso = ({ config, hito, prospecto, archivos, comentarios, esActual, hitos, onCambio }) => {
  const notas = (prospecto.radar_archivos || []).filter((a) => a.tipo === 'nota_ejecutiva');
  const { puedePaso, responsablesDe, esAdmin, nombreDe } = useRadar();
  const n = config.paso;
  const hecho = Boolean(hito?.fecha_real);
  const mio = puedePaso(n);
  const [ocupado, setOcupado] = useState(false);
  const [valores, setValores] = useState({
    enfoque_servicio: prospecto.enfoque_servicio,
    enfoque_angulo: prospecto.enfoque_angulo,
    enfoque_cuidar: prospecto.enfoque_cuidar,
    fecha_envio: prospecto.fecha_envio || hoyISO(),
    crm_url: prospecto.crm_url || '',
  });
  const [observaciones, setObservaciones] = useState('');

  const ejecutar = async (fn, mensaje) => {
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

  // Los pasos 4, 8 y 9 guardan sus campos antes de cerrarse.
  const camposDelPaso = {
    4: ['enfoque_servicio', 'enfoque_angulo', 'enfoque_cuidar'],
    8: ['fecha_envio'],
    9: ['crm_url'],
  }[n];

  const guardarCampos = () =>
    actualizarProspecto(prospecto.id, Object.fromEntries(camposDelPaso.map((c) => [c, valores[c]?.trim?.() ?? valores[c]])));

  const cerrar = () =>
    ejecutar(async () => {
      if (camposDelPaso) await guardarCampos();
      await completarPaso(prospecto.id, n);
    }, `Paso ${n} cerrado.`);

  // La nota se corrige en el paso 5 mientras el 6 siga abierto.
  const paso6Abierto = hitos.some((h) => h.paso === 6 && !h.fecha_real) && hitos.some((h) => h.paso === 5 && h.fecha_real);
  const puedeSubir = mio && (!hecho || (n === 5 && paso6Abierto));

  const ultimoComentario6 = comentarios.filter((c) => c.tipo !== 'comentario').at(-1);
  const ultimaNota = [...notas].sort((a, b) => b.version - a.version)[0];
  const esperandoCorreccion =
    n === 6 && !hecho && ultimoComentario6?.tipo === 'observacion' && (!ultimaNota || ultimaNota.subido_en < ultimoComentario6.creado_en);

  const alcanzado = hecho || esActual;

  return (
    <li className={`rounded-2xl border p-5 ${esActual ? 'border-[rgb(53,92,143)] bg-white shadow-md' : hecho ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
            hecho ? 'bg-emerald-500 text-white' : esActual ? 'bg-[rgb(53,92,143)] text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {hecho ? <CheckIcon className="h-5 w-5" /> : n}
        </span>
        <div className="flex-1 min-w-[12rem]">
          <p className={`font-black ${alcanzado ? 'text-[#1a2f4e]' : 'text-gray-400'}`}>{config.nombre}</p>
          <p className="text-xs text-gray-500">
            {responsablesDe(n)} · {config.entregable}
          </p>
        </div>
        {hito && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {esAdmin && !hecho ? (
              <label className="flex items-center gap-1">
                Compromiso
                <input
                  type="date"
                  className="rounded border border-gray-200 px-1 py-0.5"
                  value={hito.fecha_compromiso}
                  onChange={(e) =>
                    e.target.value && ejecutar(() => moverFechaCompromiso(prospecto.id, n, e.target.value), 'Fecha movida.')
                  }
                />
              </label>
            ) : (
              <span>Compromiso {formatoFecha(hito.fecha_compromiso)}</span>
            )}
            {hecho && <span>Hecho {formatoFecha(hito.fecha_real)} por {nombreDe(hito.completado_por)}</span>}
            <Semaforo hito={hito} />
          </div>
        )}
      </div>

      {alcanzado && (
        <div className="mt-4 ml-0 md:ml-11">
          {(n === 3 || n === 5) && (
            <Archivos prospecto={prospecto} paso={n} archivos={archivos} puedeSubir={puedeSubir} onCambio={onCambio} />
          )}

          {n === 4 && (
            <Enfoque prospecto={prospecto} editable={mio && !hecho} valores={valores} setValores={setValores} />
          )}

          {n === 6 && esperandoCorreccion && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              Esperando la nota corregida: {responsablesDe(5)} debe subirla como versión nueva en el paso 5.
            </p>
          )}

          {n === 6 && esActual && mio && (
            <div className="mt-3 space-y-2">
              <textarea
                rows={3}
                className={claseCampo}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones para corregir (o un comentario con el visto bueno)"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className={claseBotonSecundario}
                  disabled={ocupado || !observaciones.trim()}
                  onClick={() =>
                    ejecutar(async () => {
                      await registrarObservaciones(prospecto.id, observaciones);
                      setObservaciones('');
                    }, 'Observaciones registradas. Se suma una ronda.')
                  }
                >
                  Registrar observaciones
                </button>
                <button
                  className={claseBoton}
                  disabled={ocupado || esperandoCorreccion}
                  title={esperandoCorreccion ? 'Primero debe subirse la nota corregida' : undefined}
                  onClick={() => ejecutar(() => completarPaso(prospecto.id, 6, observaciones), 'Visto bueno registrado.')}
                >
                  <CheckIcon className="h-4 w-4" /> Dar visto bueno
                </button>
              </div>
            </div>
          )}

          {n === 8 && (
            mio && !hecho ? (
              <label className="text-sm font-bold text-gray-600">
                Fecha de envío
                <input
                  type="date"
                  className={`${claseCampo} mt-1 max-w-xs`}
                  value={valores.fecha_envio}
                  onChange={(e) => setValores({ ...valores, fecha_envio: e.target.value })}
                />
              </label>
            ) : (
              <p className="text-sm text-gray-700">Enviado: {formatoFecha(prospecto.fecha_envio)}</p>
            )
          )}

          {n === 9 && (
            mio && !hecho ? (
              <label className="text-sm font-bold text-gray-600">
                Enlace del prospecto en el CRM
                <input
                  type="url"
                  className={`${claseCampo} mt-1`}
                  value={valores.crm_url}
                  onChange={(e) => setValores({ ...valores, crm_url: e.target.value })}
                  placeholder="https://"
                />
              </label>
            ) : prospecto.crm_url ? (
              <a href={prospecto.crm_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[rgb(53,92,143)] hover:underline">
                Abrir en el CRM
              </a>
            ) : (
              <Vacio>Sin enlace al CRM.</Vacio>
            )
          )}

          {esActual && mio && n >= 3 && n !== 6 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {n === 4 && (
                <button
                  className={claseBotonSecundario}
                  disabled={ocupado}
                  onClick={() => ejecutar(guardarCampos, 'Enfoque guardado.')}
                >
                  Guardar borrador
                </button>
              )}
              <button className={claseBoton} disabled={ocupado} onClick={cerrar}>
                <CheckIcon className="h-4 w-4" /> Marcar paso como hecho
              </button>
            </div>
          )}

          {esActual && !mio && (
            <p className="mt-3 text-sm text-gray-400">Le toca a {responsablesDe(n)}.</p>
          )}

          <Comentarios prospecto={prospecto} paso={n} comentarios={comentarios} onCambio={onCambio} />
        </div>
      )}
    </li>
  );
};

export default function RadarProspecto() {
  const { id } = useParams();
  const { pasos } = useRadar();
  const [prospecto, setProspecto] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    obtenerProspecto(id)
      .then(setProspecto)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) return <Tarjeta><Vacio>{error}</Vacio></Tarjeta>;
  if (!prospecto) return <p className="text-gray-400">Cargando prospecto…</p>;

  const hitos = prospecto.radar_hitos || [];
  const actual = pasoActual(hitos);
  const comentarios = [...(prospecto.radar_comentarios || [])].sort((a, b) => a.creado_en.localeCompare(b.creado_en));

  return (
    <div className="space-y-6">
      <Link to={RADAR} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#1a2f4e]">
        <ChevronLeftIcon className="h-4 w-4" /> Prospectos
      </Link>

      <Tarjeta>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#1a2f4e]">{prospecto.empresa}</h2>
            {prospecto.sector && <p className="mt-1 text-sm font-semibold text-gray-500">Sector: {prospecto.sector}</p>}
            {prospecto.sitio_web && <a href={prospecto.sitio_web} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-[rgb(53,92,143)] hover:underline">Abrir sitio web / LinkedIn</a>}
            <p className="text-sm text-gray-500">
              {ESTADOS[prospecto.estado]} · Lista del {formatoFecha(prospecto.fecha_lista)}
              {actual && ` · Va en el paso ${actual.paso} de 9`}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            {prospecto.score != null && (
              <div>
                <p className="text-2xl font-black text-[#25c6e3]">{prospecto.score}</p>
                <p className="text-xs font-bold uppercase text-gray-400">Score</p>
              </div>
            )}
            <div>
              <p className="text-2xl font-black text-[#1a2f4e]">{prospecto.rondas}</p>
              <p className="text-xs font-bold uppercase text-gray-400">Rondas</p>
            </div>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><dt className="font-bold text-gray-500">Señal</dt><dd className="text-gray-700 whitespace-pre-line">{prospecto.senal || '—'}</dd></div>
          <div><dt className="font-bold text-gray-500">Por qué ahora</dt><dd className="text-gray-700 whitespace-pre-line">{prospecto.por_que_ahora || '—'}</dd></div>
          <div><dt className="font-bold text-gray-500">Servicios a ofrecer</dt><dd className="text-gray-700 whitespace-pre-line">{prospecto.servicios || '—'}</dd></div>
        </dl>
      </Tarjeta>

      {hitos.length === 0 ? (
        <Tarjeta><Vacio>Este prospecto todavía no ha sido elegido.</Vacio></Tarjeta>
      ) : (
        <ol className="space-y-3">
          {pasos.map((config) => (
            <Paso
              key={`${config.paso}-${prospecto.rondas}`}
              config={config}
              hito={hitos.find((h) => h.paso === config.paso)}
              hitos={hitos}
              prospecto={prospecto}
              archivos={(prospecto.radar_archivos || []).filter((a) => a.paso === config.paso)}
              comentarios={comentarios.filter((c) => c.paso === config.paso)}
              esActual={actual?.paso === config.paso}
              onCambio={cargar}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
