import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { obtenerDocumentosPorCliente } from '../lib/documentosApi'; 
import ClientSidebar from '../components/client/ClientSidebar.jsx';
import { 
  DocumentTextIcon
} from '@heroicons/react/24/solid';


// Panel Resumen (Nueva Página de Bienvenida)
const DashboardHome = ({ user }) => {
  const sections = [ 
    { 
      title: 'Mis Documentos', 
      description: 'Accede a los documentos oficiales emitidos por E360.',
      link: '/cliente/documentos' 
    },
  ];

  return (
    <div>
      <div className="bg-white p-8 rounded-lg shadow-lg border-l-4 border-blue-600 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.email?.split('@')[0] || 'Cliente'}</h1>
        <p className="text-gray-600 mt-2">Bienvenido a su portal de cliente.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800">Acciones Rápidas</h2>
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

// --- Nuevo Componente para listar documentos del cliente ---
const DocumentosCliente = ({ user }) => {
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [errorDocs, setErrorDocs] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDocumentos = async () => {
      if (!user?.id) return;
      setLoadingDocs(true);
      setErrorDocs(null);
      try {
        const docs = await obtenerDocumentosPorCliente(user.id);
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

  if (loadingDocs) return <p>Cargando sus documentos...</p>;
  if (errorDocs) return <p className="text-red-500">{errorDocs}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mis Documentos Emitidos</h1>
      {documentos.length === 0 ? (
        <p className="text-gray-600">No tienes documentos emitidos asignados.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre del Documento
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha de Emisión
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => (
                <tr key={doc.uuid} className="hover:bg-gray-50">
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{doc.nombre_documento}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {new Date(doc.fecha_emision).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full text-white bg-green-500">
                      Emitido
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <button
                      onClick={() => handleVerDocumento(doc.uuid)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                    >
                      Ver documento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
      <main className="flex-1 p-8 mt-10">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="dashboard" element={<DashboardHome user={user} />} />
            <Route path="documentos" element={<DocumentosCliente user={user} />} /> {/* RUTA MANTENIDA */}
            <Route index element={<DashboardHome user={user} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
