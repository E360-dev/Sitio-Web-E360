import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useRol } from '../../../../hooks/useRol';
import { obtenerMiAcceso, obtenerAccesos, obtenerPasos } from '../../../../lib/radarApi';
import RadarProspectos from './RadarProspectos.jsx';
import RadarListaCorta from './RadarListaCorta.jsx';
import RadarFlujo from './RadarFlujo.jsx';
import RadarAccesos from './RadarAccesos.jsx';
import RadarProspecto from './RadarProspecto.jsx';

const RadarContext = createContext(null);

/**
 * Datos comunes a todas las pantallas del Radar:
 * mi acceso, el flujo, los nombres del equipo y utilidades de permisos.
 */
export const useRadar = () => useContext(RadarContext);

export default function RadarComercial() {
  const { rol } = useRol();
  const [estado, setEstado] = useState({ cargando: true, acceso: null, pasos: [], accesos: [] });

  const cargar = useCallback(async () => {
    try {
      const acceso = await obtenerMiAcceso();
      if (!acceso) {
        setEstado({ cargando: false, acceso: null, pasos: [], accesos: [] });
        return;
      }
      const [pasos, accesos] = await Promise.all([obtenerPasos(), obtenerAccesos()]);
      setEstado({ cargando: false, acceso, pasos, accesos });
    } catch {
      setEstado({ cargando: false, acceso: null, pasos: [], accesos: [] });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const esAdmin = rol === 'admin';
  const { cargando, acceso, pasos, accesos } = estado;

  if (cargando) return <p className="text-gray-400">Cargando el Radar…</p>;

  // Sin acceso: un admin solo ve "Accesos" para darse de alta o dar de alta a otros.
  if (!acceso && !esAdmin) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
        <h1 className="text-xl font-black text-[#1a2f4e]">No tienes acceso al Radar comercial</h1>
        <p className="text-gray-500 mt-2">Pide a administración que te dé de alta.</p>
        <Link to="/admin/conocimiento" className="inline-block mt-6 text-[rgb(53,92,143)] font-bold">
          Volver al Centro de conocimiento
        </Link>
      </div>
    );
  }

  const nombreDe = (userId) => accesos.find((a) => a.user_id === userId)?.nombre || 'Alguien del equipo';
  const responsablesDe = (paso) => {
    const nombres = accesos.filter((a) => a.pasos.includes(paso)).map((a) => a.nombre);
    return nombres.length ? nombres.join(' y ') : pasos.find((p) => p.paso === paso)?.responsable || '—';
  };
  const puedePaso = (paso) => Boolean(acceso?.pasos.includes(paso));

  const valor = { acceso, pasos, accesos, esAdmin, nombreDe, responsablesDe, puedePaso, recargarComunes: cargar };

  const pestanas = [
    { to: '', nombre: 'Prospectos', end: true },
    { to: 'lista-corta', nombre: 'Lista corta' },
    { to: 'flujo', nombre: 'Flujo' },
    ...(esAdmin ? [{ to: 'accesos', nombre: 'Accesos' }] : []),
  ].filter((p) => acceso || p.to === 'accesos');

  return (
    <RadarContext.Provider value={valor}>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div>
          <Link to="/admin/conocimiento" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#1a2f4e]">
            <ChevronLeftIcon className="h-4 w-4" /> Centro de conocimiento
          </Link>
          <div className="mt-3 bg-[rgb(53,92,143)] rounded-3xl shadow-xl px-8 py-6">
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Radar <span className="text-[#25c6e3]">comercial</span>
            </h1>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 border-b border-gray-200">
          {pestanas.map((p) => (
            <NavLink
              key={p.nombre}
              to={p.to}
              end={p.end}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-[rgb(53,92,143)] text-[rgb(53,92,143)]'
                    : 'border-transparent text-gray-500 hover:text-[#1a2f4e]'
                }`
              }
            >
              {p.nombre}
            </NavLink>
          ))}
        </nav>

        <Routes>
          {acceso ? (
            <>
              <Route index element={<RadarProspectos />} />
              <Route path="lista-corta" element={<RadarListaCorta />} />
              <Route path="flujo" element={<RadarFlujo />} />
              <Route path="prospecto/:id" element={<RadarProspecto />} />
            </>
          ) : (
            <Route index element={<Navigate to="accesos" replace />} />
          )}
          {esAdmin && <Route path="accesos" element={<RadarAccesos />} />}
          <Route path="*" element={<Navigate to="/admin/conocimiento/radar" replace />} />
        </Routes>
      </div>
    </RadarContext.Provider>
  );
}
