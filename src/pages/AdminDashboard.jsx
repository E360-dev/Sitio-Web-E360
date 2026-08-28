import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar.jsx';
import GestionDocumentos from '../components/admin/GestionDocumentos.jsx';
import GestionArticulos from '../components/admin/GestionArticulos.jsx';
import EdicionArticulo from '../components/admin/EdicionArticulo.jsx';
import AdminDocumentDetail from '../components/admin/AdminDocumentDetail.jsx';
import EnviarCorreoManual from '../components/admin/EnviarCorreoManual.jsx';
import ServerControlButton from '../components/admin/ServerControlButton.jsx';
import { supabase } from '../lib/supabaseClient';
import { 
  UserGroupIcon,
  DocumentDuplicateIcon,
  CpuChipIcon,
  EllipsisVerticalIcon,
  CursorArrowRaysIcon,
  BellAlertIcon
} from '@heroicons/react/24/solid';

// --- Subcomponentes Refinados ---

const KpiCard = ({ title, value, icon: Icon, isLoading, className = '' }) => (
  <div className={`bg-[rgb(53,92,143)] p-8 rounded-2xl shadow-sm border border-white/10 flex flex-col items-center justify-center text-center transition-all hover:shadow-md min-h-[220px] ${className}`}>
    <div className="bg-white/10 p-5 rounded-full mb-5">
      <Icon className="h-9 w-9 text-[#25c6e3]" />
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-3">{title}</p>
      <p className="text-5xl font-black text-white">{isLoading ? '...' : value}</p>
    </div>
  </div>
);

const AdminDashboardHome = ({ user }) => {
  const [stats, setStats] = useState({ clientes: 0 });
  const [loading, setLoading] = useState(true);
  const userName = user?.email?.split('@')[0] || 'Administrador';
  const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { count: clientCount } = await supabase.from('clientes').select('id', { count: 'exact', head: true });
        setStats({ clientes: clientCount || 0 });
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const sections = [
    { 
      title: 'GESTIÓN DE DOCUMENTOS',
      description: 'Crea y administra documentos probatorios para los clientes.',
      link: '/admin/documentos',
      icon: DocumentDuplicateIcon
    },
    { 
      title: 'NOTIFICACIONES MANUALES',
      description: 'Envía correos con QR personalizado a cualquier destinatario.',
      link: '/admin/enviar-correo',
      icon: BellAlertIcon
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Banner de Bienvenida Admin */}
      <div className="space-y-4">
        <div className="mx-6 bg-[rgb(53,92,143)] rounded-3xl shadow-xl px-8 py-8 sm:px-10">
          <div className="flex items-center justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Panel de <span className="text-[#25c6e3]">Control</span>
            </h1>
            <button
              type="button"
              aria-label="Opciones del panel"
              className="shrink-0 rounded-full bg-black/20 p-2 text-white transition-colors hover:text-[#25c6e3] active:scale-95"
            >
              <EllipsisVerticalIcon className="h-7 w-7" />
            </button>
          </div>
        </div>
        <p className="px-2 text-center text-lg font-semibold tracking-wide">
          <span className="text-[rgb(53,92,143)]">{`Bienvenido ${capitalizedUserName} - `}</span>
          <span className="text-black">{'Gesti\u00f3n estrat\u00e9gica del Sistema E360'}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Bloque de Control de Servidor con estilo integrado */}
        <div className="md:col-span-2 bg-[rgb(53,92,143)] p-8 rounded-2xl shadow-sm border border-white/10 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <CpuChipIcon className="h-6 w-6 text-[#25c6e3]" />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Estado del Sistema</h3>
          </div>
          <ServerControlButton />
        </div>

        <KpiCard title="Clientes Registrados" value={stats.clientes} icon={UserGroupIcon} isLoading={loading} className="md:col-span-1" />
      </div>

      {/* Accesos Directos */}
      <div className="bg-[rgb(53,92,143)] rounded-2xl p-10 shadow-sm">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <CursorArrowRaysIcon className="h-5 w-5 text-[#25c6e3]" />
            <h2 className="text-sm font-black tracking-[0.3em] text-white uppercase">
              Accesos Directos
            </h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>
          <div className="h-1 w-12 bg-[#25c6e3] mt-3 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map(section => (
            <Link 
              key={section.title} 
              to={section.link} 
              className="group relative flex flex-col bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[#25c6e3]/20 overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#25c6e3]/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <section.icon className="h-8 w-8 text-[#25c6e3] mb-4" />
                <h3 className="font-black text-[#1a2f4e] text-lg tracking-wider mb-2">{section.title}</h3>
                <p className="text-[#25c6e3] text-sm leading-relaxed">{section.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Layout y Enrutador ---

const AdminDashboardContent = ({ user }) => (
  <div className="max-w-6xl">
    <Routes>
      <Route path="documentos" element={<GestionDocumentos />} />
      <Route path="documentos/:uuid" element={<AdminDocumentDetail />} />
      <Route path="comunica" element={<GestionArticulos />} />
      <Route path="comunica/:id" element={<EdicionArticulo />} />
      <Route path="enviar-correo" element={<EnviarCorreoManual />} />
      <Route path="dashboard" element={<AdminDashboardHome user={user} />} />
      <Route index element={<AdminDashboardHome user={user} />} />
    </Routes>
  </div>
);

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto bg-gray-100">
        <AdminDashboardContent user={user} />
      </main>
    </div>
  );
}
