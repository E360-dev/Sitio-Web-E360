import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRol } from '../../../hooks/useRol';
import {
  eliminarCuentaTecnologia,
  guardarCuentaTecnologia,
  obtenerCuentasTecnologia,
} from '../../../lib/cuentasTecnologiaApi';
import { Tarjeta, Vacio, claseBoton, claseBotonSecundario, claseCampo } from './radar/RadarUi.jsx';

const INICIAL = { herramienta: '', plan: '', dia_renovacion: '', costo: '', moneda: 'COP' };

const formatoCosto = (costo, moneda) => {
  if (costo == null || costo === '') return '—';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda || 'COP',
      maximumFractionDigits: 2,
    }).format(Number(costo));
  } catch {
    return `${costo} ${moneda || ''}`.trim();
  }
};

export default function CuentasTecnologia() {
  const { rol } = useRol();
  const puedeAdministrar = rol === 'admin';
  const [cuentas, setCuentas] = useState(null);
  const [formulario, setFormulario] = useState(INICIAL);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setCuentas(await obtenerCuentasTecnologia());
      setError('');
    } catch (e) {
      setError(e.message);
      setCuentas([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (campo) => (e) => setFormulario((actual) => ({ ...actual, [campo]: e.target.value }));

  const cancelarEdicion = () => {
    setEditando(null);
    setFormulario(INICIAL);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await guardarCuentaTecnologia({
        ...(editando ? { id: editando } : {}),
        herramienta: formulario.herramienta.trim(),
        plan: formulario.plan.trim(),
        dia_renovacion: Number(formulario.dia_renovacion),
        costo: formulario.costo === '' ? null : Number(formulario.costo),
        moneda: formulario.moneda,
      });
      cancelarEdicion();
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const editar = (cuenta) => {
    setEditando(cuenta.id);
    setFormulario({
      herramienta: cuenta.herramienta,
      plan: cuenta.plan,
      dia_renovacion: String(cuenta.dia_renovacion),
      costo: cuenta.costo == null ? '' : String(cuenta.costo),
      moneda: cuenta.moneda || 'COP',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = async (cuenta) => {
    if (!window.confirm(`¿Eliminar ${cuenta.herramienta} (${cuenta.plan})?`)) return;
    setError('');
    try {
      await eliminarCuentaTecnologia(cuenta.id);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/conocimiento" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#1a2f4e]">
          <ChevronLeftIcon className="h-4 w-4" /> Centro de conocimiento
        </Link>
        <div className="mt-3 bg-[rgb(53,92,143)] rounded-3xl shadow-xl px-8 py-6">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Cuentas de <span className="text-[#25c6e3]">tecnología</span>
          </h1>
          <p className="mt-2 text-white/70 font-semibold">Planes, costos y día de renovación de las herramientas del equipo.</p>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {puedeAdministrar && (
        <Tarjeta titulo={editando ? 'Editar herramienta' : 'Agregar herramienta'}>
          <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <label className="md:col-span-2 text-sm font-bold text-gray-600">
              Herramienta
              <input className={`${claseCampo} mt-1`} value={formulario.herramienta} onChange={cambiar('herramienta')} placeholder="ChatGPT, Cloud…" required maxLength={120} />
            </label>
            <label className="md:col-span-2 text-sm font-bold text-gray-600">
              Plan
              <input className={`${claseCampo} mt-1`} value={formulario.plan} onChange={cambiar('plan')} placeholder="Plus, Pro, Business…" required maxLength={120} />
            </label>
            <label className="md:col-span-2 text-sm font-bold text-gray-600">
              Día del mes en que renueva (1–31)
              <input type="number" min="1" max="31" step="1" className={`${claseCampo} mt-1`} value={formulario.dia_renovacion} onChange={cambiar('dia_renovacion')} required />
            </label>
            <label className="md:col-span-2 text-sm font-bold text-gray-600">
              Costo del plan (opcional)
              <input type="number" min="0" step="0.01" className={`${claseCampo} mt-1`} value={formulario.costo} onChange={cambiar('costo')} placeholder="0.00" />
            </label>
            <label className="md:col-span-1 text-sm font-bold text-gray-600">
              Moneda
              <select className={`${claseCampo} mt-1`} value={formulario.moneda} onChange={cambiar('moneda')}>
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <div className="md:col-span-3 flex items-end justify-end gap-2">
              {editando && <button type="button" className={claseBotonSecundario} onClick={cancelarEdicion}>Cancelar</button>}
              <button type="submit" className={claseBoton} disabled={guardando}>
                {editando ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar herramienta'}
              </button>
            </div>
          </form>
        </Tarjeta>
      )}

      <Tarjeta titulo="Herramientas registradas">
        {cuentas === null ? (
          <Vacio>Cargando cuentas…</Vacio>
        ) : cuentas.length === 0 ? (
          <Vacio>Aún no hay herramientas registradas.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-4">Herramienta</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Día de renovación</th>
                  <th className="py-2 pr-4">Costo</th>
                  {puedeAdministrar && <th className="py-2">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cuentas.map((cuenta) => (
                  <tr key={cuenta.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-bold text-[#1a2f4e]">{cuenta.herramienta}</td>
                    <td className="py-3 pr-4">{cuenta.plan}</td>
                    <td className="py-3 pr-4">Día {cuenta.dia_renovacion} de cada mes</td>
                    <td className="py-3 pr-4">{formatoCosto(cuenta.costo, cuenta.moneda)}</td>
                    {puedeAdministrar && (
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => editar(cuenta)} className="text-[rgb(53,92,143)] hover:text-[#1a2f4e]" aria-label={`Editar ${cuenta.herramienta}`} title="Editar">
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button type="button" onClick={() => eliminar(cuenta)} className="text-red-500 hover:text-red-700" aria-label={`Eliminar ${cuenta.herramienta}`} title="Eliminar">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    )}
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
