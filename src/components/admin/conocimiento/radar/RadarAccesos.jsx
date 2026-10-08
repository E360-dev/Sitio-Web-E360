import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { obtenerAccesos, obtenerUsuariosInternos, guardarAcceso, quitarAcceso } from '../../../../lib/radarApi';
import { useRadar } from './RadarComercial.jsx';
import { Tarjeta, Vacio, claseBoton, claseBotonSecundario, claseCampo } from './RadarUi.jsx';

const PASOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const SelectorPasos = ({ pasos, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {PASOS.map((n) => {
      const activo = pasos.includes(n);
      return (
        <button
          key={n}
          type="button"
          onClick={() => onChange(activo ? pasos.filter((p) => p !== n) : [...pasos, n].sort((a, b) => a - b))}
          className={`h-8 w-8 rounded-lg text-sm font-black transition-colors ${
            activo ? 'bg-[rgb(53,92,143)] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          aria-pressed={activo}
          title={`Paso ${n}`}
        >
          {n}
        </button>
      );
    })}
  </div>
);

const Fila = ({ acceso, email, onCambio }) => {
  const [nombre, setNombre] = useState(acceso.nombre);
  const [pasos, setPasos] = useState(acceso.pasos);
  const [ocupado, setOcupado] = useState(false);
  const cambiado = nombre !== acceso.nombre || pasos.join() !== acceso.pasos.join();

  const ejecutar = async (fn, mensaje) => {
    setOcupado(true);
    try {
      await fn();
      toast.success(mensaje);
      onCambio();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <li className="flex flex-col lg:flex-row lg:items-center gap-4 py-4">
      <div className="lg:w-56">
        <input className={claseCampo} value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre" />
        <p className="mt-1 text-xs text-gray-400 truncate">{email || 'Usuario del sistema'}</p>
      </div>
      <div className="flex-1">
        <SelectorPasos pasos={pasos} onChange={setPasos} />
        {pasos.length === 0 && <p className="mt-1 text-xs text-gray-400">Solo consulta</p>}
      </div>
      <div className="flex gap-2">
        <button
          className={claseBoton}
          disabled={!cambiado || ocupado || !nombre.trim()}
          onClick={() => ejecutar(() => guardarAcceso({ user_id: acceso.user_id, nombre: nombre.trim(), pasos }), 'Acceso actualizado.')}
        >
          Guardar
        </button>
        <button
          className={claseBotonSecundario}
          disabled={ocupado}
          onClick={() =>
            window.confirm(`¿Quitar el acceso de ${acceso.nombre} al Radar?`) &&
            ejecutar(() => quitarAcceso(acceso.user_id), 'Acceso quitado.')
          }
        >
          Quitar
        </button>
      </div>
    </li>
  );
};

export default function RadarAccesos() {
  const { recargarComunes } = useRadar();
  const [accesos, setAccesos] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [nuevo, setNuevo] = useState({ user_id: '', nombre: '', pasos: [] });
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [a, u] = await Promise.all([obtenerAccesos(), obtenerUsuariosInternos()]);
      setAccesos(a);
      setUsuarios(u);
    } catch (error) {
      toast.error(error.message);
      setAccesos([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alCambiar = () => {
    cargar();
    recargarComunes();
  };

  const agregar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await guardarAcceso({ ...nuevo, nombre: nuevo.nombre.trim() });
      toast.success('Persona dada de alta en el Radar.');
      setNuevo({ user_id: '', nombre: '', pasos: [] });
      alCambiar();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!accesos) return <p className="text-gray-400">Cargando accesos…</p>;

  const emailDe = (id) => usuarios.find((u) => u.user_id === id)?.email;
  const disponibles = usuarios.filter((u) => !accesos.some((a) => a.user_id === u.user_id));

  return (
    <div className="space-y-6">
      <Tarjeta titulo="Quién entra al Radar">
        <p className="text-sm text-gray-500 mb-2">
          Solo las personas de esta lista ven el Radar. Los números son los pasos que cada quien puede cerrar; sin pasos, solo consulta.
        </p>
        {accesos.length === 0 ? (
          <Vacio>Nadie tiene acceso todavía.</Vacio>
        ) : (
          <ul className="divide-y divide-gray-100">
            {accesos.map((a) => (
              <Fila key={`${a.user_id}-${a.nombre}-${a.pasos.join()}`} acceso={a} email={emailDe(a.user_id)} onCambio={alCambiar} />
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta titulo="Dar de alta">
        {disponibles.length === 0 ? (
          <Vacio>
            Todas las cuentas internas ya tienen acceso. Para alguien sin cuenta, primero hay que crearle una con su rol interno.
          </Vacio>
        ) : (
          <form onSubmit={agregar} className="flex flex-col lg:flex-row lg:items-end gap-4">
            <label className="text-sm font-bold text-gray-600 lg:w-72">
              Cuenta
              <select
                className={`${claseCampo} mt-1`}
                value={nuevo.user_id}
                onChange={(e) => setNuevo({ ...nuevo, user_id: e.target.value })}
                required
              >
                <option value="" disabled>Elige una cuenta interna</option>
                {disponibles.map((u) => (
                  <option key={u.user_id} value={u.user_id}>{u.email} ({u.rol})</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-gray-600 lg:w-48">
              Nombre en el Radar
              <input
                className={`${claseCampo} mt-1`}
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                placeholder="José Luis"
                required
              />
            </label>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-600 mb-1">Pasos</p>
              <SelectorPasos pasos={nuevo.pasos} onChange={(pasos) => setNuevo({ ...nuevo, pasos })} />
            </div>
            <button type="submit" className={claseBoton} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Dar de alta'}
            </button>
          </form>
        )}
      </Tarjeta>
    </div>
  );
}
