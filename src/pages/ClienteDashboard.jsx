import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { obtenerDocumentosPorCliente, obtenerClienteIdPorUserId } from '../lib/documentosApi'; 
import ClientSidebar from '../components/client/ClientSidebar.jsx';
import { DocumentTextIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon } from '@heroicons/react/24/outline';


// Panel Resumen (Header destacado + Acciones Rápidas)
const DashboardHome = ({ user }) => {
  const userName = user?.email?.split('@')[0] || 'Cliente';
  
  const sections = [ 
    { 
      title: 'MIS DOCUMENTOS', 
      description: 'Accede a los documentos oficiales emitidos por E360.',
      link: '/cliente/documentos',
      icon: DocumentTextIcon
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 2. Header principal (bienvenida) - Banner Horizontal */}
      <div className="relative overflow-hidden bg-[#2e527f] rounded-3xl shadow-xl">
        {/* Decoración: Línea vertical al inicio */}
        <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col">
          <div className="flex-1 bg-[#25c6e3]"></div>
          <div className="flex-1 bg-[#e80554]"></div>
        </div>
        
        <div className="px-10 py-16 sm:px-16">
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Bienvenido, <span className="text-[#25c6e3]">{userName}</span>
          </h1>
          <p className="mt-4 text-xl text-white/70 font-medium tracking-wide">
            Bienvenido a tu portal de cliente.
          </p>
        </div>
      </div>

      {/* 3. Sección "Acciones Rápidas" - Bloque con borde azul */}
      <div className="bg-white border-2 border-[#2e527f]/10 rounded-3xl p-10 shadow-sm">
        <div className="mb-8">
          <h2 className="text-sm font-black tracking-[0.3em] text-[#2e527f] uppercase">
            Acciones Rápidas
          </h2>
          <div className="h-1 w-12 bg-[#25c6e3] mt-2 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(section => (
            <Link 
              key={section.title} 
              to={section.link} 
              className="group relative flex flex-col bg-[#2e527f] p-8 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[#2e527f]/20 overflow-hidden"
            >
              {/* Decoración sutil en la card */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <section.icon className="h-8 w-8 text-[#25c6e3] mb-4" />
                <h3 className="font-black text-white text-lg tracking-wider mb-2">{section.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{section.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Componente para listar documentos del cliente ---
const DocumentosCliente = ({ user }) => {
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [errorDocs, setErrorDocs] = useState(null);
  const [expandedYears, setExpandedYears] = useState({});
  const [filtroAño, setFiltroAño] = useState('');
  const navigate = useNavigate();

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !(prev[year] ?? true) }));
  };

  const añosDisponibles = [...new Set(
    documentos.map(doc => new Date(doc.fecha_emision).getFullYear())
  )].sort((a, b) => b - a);

  const documentosFiltrados = filtroAño
    ? documentos.filter(doc => new Date(doc.fecha_emision).getFullYear() === Number(filtroAño))
    : documentos;

  useEffect(() => {
    const cargarDocumentos = async () => {
      if (!user?.id) return;
      
      setLoadingDocs(true);
      setErrorDocs(null);
      try {
        const clienteId = await obtenerClienteIdPorUserId(user.id);
        if (!clienteId) {
          setErrorDocs('No se encontró su registro de cliente. Contacte a soporte.');
          setLoadingDocs(false);
          return;
        }
        const docs = await obtenerDocumentosPorCliente(clienteId);
        setDocumentos(docs);
      } catch (err) {
        setErrorDocs(err.message || 'Error al cargar sus documentos.');
      } finally {
        setLoadingDocs(false);
      }
    };
    cargarDocumentos();
  }, [user]);

  const handleVerDocumento = (uuid) => {
    navigate(`/documento/${uuid}`);
  };

  if (loadingDocs) return (
    <div className="flex items-center justify-center h-64 text-[#2e527f]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2e527f]"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-10 flex flex-wrap items-center gap-4">
        <div className="h-10 w-2 bg-[#25c6e3] rounded-full"></div>
        <h1 className="text-3xl font-black text-[#2e527f] uppercase tracking-tight">Mis Documentos Emitidos</h1>
        {documentos.length > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <label className="text-xs font-black text-[#2e527f] uppercase tracking-[0.2em]">Año</label>
            <select
              value={filtroAño}
              onChange={(e) => { setFiltroAño(e.target.value); setExpandedYears({}); }}
              className="rounded-full border border-[#2e527f]/20 bg-white px-4 py-2 text-sm font-medium text-[#2e527f] shadow-sm focus:border-[#25c6e3] focus:outline-none focus:ring-1 focus:ring-[#25c6e3]"
            >
              <option value="">Todos los años</option>
              {añosDisponibles.map(year => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {documentos.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium italic text-lg text-pretty">No tienes documentos emitidos asignados en este momento.</p>
        </div>
      ) : documentosFiltrados.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium italic text-lg text-pretty">No tienes documentos emitidos en {filtroAño}.</p>
        </div>
      ) : (() => {
        const porAño = Object.entries(
          documentosFiltrados.reduce((acc, doc) => {
            const year = new Date(doc.fecha_emision).getFullYear();
            if (!acc[year]) acc[year] = [];
            acc[year].push(doc);
            return acc;
          }, {})
        ).sort(([a], [b]) => Number(b) - Number(a));

        return (
          <div className="space-y-3">
            {porAño.map(([year, docs]) => (
              <div key={year} className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-8 py-5 bg-[#2e527f]/5 hover:bg-[#2e527f]/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#2e527f] uppercase tracking-[0.2em]">{year}</span>
                    <span className="text-xs text-gray-400 font-medium">{docs.length} documento{docs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-[#2e527f] transition-transform duration-200 ${expandedYears[year] !== false ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedYears[year] !== false && (
                  <div className="divide-y divide-gray-50">
                    {docs.map(doc => (
                      <div key={doc.uuid} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-900 italic">{doc.nombre_documento}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(doc.fecha_emision).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleVerDocumento(doc.uuid)}
                          className="inline-flex items-center px-6 py-2.5 bg-[#2e527f] hover:bg-[#1e3a5f] text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg transition-all transform hover:scale-105 shrink-0 ml-4"
                        >
                          Ver documento
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

// --- Layout Principal ---

export default function ClienteDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar />
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl">
          <Routes>
            <Route path="dashboard" element={<DashboardHome user={user} />} />
            <Route path="documentos" element={<DocumentosCliente user={user} />} />
            <Route index element={<DashboardHome user={user} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
