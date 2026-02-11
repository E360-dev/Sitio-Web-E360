import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar.jsx';
import GestionDocumentos from '../components/admin/GestionDocumentos.jsx';
import AdminDocumentDetail from '../components/admin/AdminDocumentDetail.jsx'; // <-- MANTENIDO
import { supabase } from '../lib/supabaseClient';
import { 
  UserGroupIcon
} from '@heroicons/react/24/solid';

// --- Subcomponentes del Nuevo Dashboard ---

const KpiCard = ({ title, value, icon: Icon, isLoading }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-blue-500">
    <div className="bg-blue-100 p-3 rounded-full">
      <Icon className="h-8 w-8 text-blue-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : value}</p>
    </div>
  </div>
);

const AdminDashboardHome = () => {
  const [stats, setStats] = useState({ clientes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch KPIs
        const { count: clientCount } = await supabase.from('clientes').select('id', { count: 'exact', head: true });
        
        setStats({
          clientes: clientCount || 0,
        });

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
      title: 'Gestión de Documentos', // <-- MANTENIDO
      description: 'Crea y administra documentos probatorios para los clientes.',
      link: '/admin/documentos' 
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Mando</h1>
        <p className="text-gray-600 mt-1">Resumen general del sistema.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard title="Total de Clientes" value={stats.clientes} icon={UserGroupIcon} isLoading={loading} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Accesos Directos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(section => (
            <Link key={section.title} to={section.link} className="p-4 rounded-lg hover:bg-gray-50 border">
              <span className="font-semibold text-gray-800">{section.title}</span>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Layout y Enrutador ---

const AdminDashboardContent = () => (
  <div className="max-w-7xl mx-auto">
    <Routes>
      <Route path="documentos" element={<GestionDocumentos />} />
      <Route path="documentos/:uuid" element={<AdminDocumentDetail />} /> {/* <-- RUTA MANTENIDA */}
      <Route path="dashboard" element={<AdminDashboardHome />} />
      <Route index element={<AdminDashboardHome />} />
    </Routes>
  </div>
);

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminDashboardContent />
      </main>
    </div>
  );
}
