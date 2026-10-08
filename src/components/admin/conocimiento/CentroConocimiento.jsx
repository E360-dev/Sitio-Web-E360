import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { BookOpenIcon, ChartBarSquareIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { obtenerMiAcceso } from '../../../lib/radarApi';
import { useRol } from '../../../hooks/useRol';
import RadarComercial from './radar/RadarComercial.jsx';

const Portada = () => {
  const { rol } = useRol();
  const [acceso, setAcceso] = useState(undefined);

  useEffect(() => {
    obtenerMiAcceso().then(setAcceso).catch(() => setAcceso(null));
  }, []);

  const verRadar = acceso || rol === 'admin';

  return (
    <div className="space-y-8">
      <div className="bg-[rgb(53,92,143)] rounded-3xl shadow-xl px-8 py-8">
        <h1 className="text-4xl font-black text-white leading-tight">
          Centro de <span className="text-[#25c6e3]">conocimiento</span>
        </h1>
        <p className="mt-2 text-white/70 font-semibold">
          Políticas, herramientas, agentes y el seguimiento comercial del equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {acceso === undefined ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-gray-400">Cargando…</div>
        ) : verRadar ? (
          <Link
            to="radar"
            className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <ChartBarSquareIcon className="h-9 w-9 text-[#25c6e3] mb-4" />
            <h2 className="font-black text-[#1a2f4e] text-lg tracking-wider">RADAR COMERCIAL</h2>
            <p className="text-gray-500 text-sm mt-2">
              Prospectos, en qué paso va cada uno y el flujo que sigue el equipo.
            </p>
          </Link>
        ) : null}

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-dashed border-gray-200">
          <BookOpenIcon className="h-9 w-9 text-gray-300 mb-4" />
          <h2 className="font-black text-gray-400 text-lg tracking-wider">BIBLIOTECA</h2>
          <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
            <LockClosedIcon className="h-4 w-4" /> Próximamente: políticas, herramientas y agentes de IA.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function CentroConocimiento() {
  return (
    <Routes>
      <Route index element={<Portada />} />
      <Route path="radar/*" element={<RadarComercial />} />
    </Routes>
  );
}
