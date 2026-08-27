import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { obtenerClientes, crearDocumentoBorrador } from '../../lib/documentosApi'; // EmitirDocumento, SubirPdfYAsociar ya no se usan directamente aquí
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { ChevronDownIcon } from '@heroicons/react/24/outline';


// --- Sub-componentes Modales ---

const CrearDocumentoModal = ({ isOpen, onClose, onDocumentoCreado, clientes }) => {
  const [idCliente, setIdCliente] = useState('');
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNombreDocumento('');
      setIdCliente('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await crearDocumentoBorrador(nombreDocumento, idCliente);
      toast.success('Documento borrador creado con éxito.');
      onDocumentoCreado();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al crear el documento.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nuevo Documento</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Documento</label>
            <input id="nombre" type="text" value={nombreDocumento} onChange={(e) => setNombreDocumento(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div className="mb-6">
            <label htmlFor="cliente" className="block text-gray-700 text-sm font-bold mb-2">Asignar a Cliente</label>
            <select id="cliente" value={idCliente} onChange={(e) => setIdCliente(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
              <option value="" disabled>Seleccione un cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.empresa ? `(${cliente.empresa})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled={isLoading}>Cancelar</button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Borrador'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ConfirmarEmisionModal, PdfUploadCell, AccionesCell y sus funciones auxiliares han sido movidos o eliminados.

// --- Componente Principal ---

const GestionDocumentos = () => {
  const [documentos, setDocumentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate(); // Hook para la navegación
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroAño, setFiltroAño] = useState('');
  const [expandedYears, setExpandedYears] = useState({});

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !(prev[year] ?? true) }));
  };

  const documentosPorCliente = filtroCliente
    ? documentos.filter(doc => String(doc.id_cliente_asignado) === filtroCliente)
    : documentos;

  const añosDisponibles = [...new Set(
    documentosPorCliente.map(doc => new Date(doc.fecha_creacion).getFullYear())
  )].sort((a, b) => b - a);

  const documentosFiltrados = filtroAño
    ? documentosPorCliente.filter(doc => new Date(doc.fecha_creacion).getFullYear() === Number(filtroAño))
    : documentosPorCliente;

  const documentosPorAño = filtroCliente
    ? Object.entries(
        documentosFiltrados.reduce((acc, doc) => {
          const year = new Date(doc.fecha_creacion).getFullYear();
          if (!acc[year]) acc[year] = [];
          acc[year].push(doc);
          return acc;
        }, {})
      ).sort(([a], [b]) => Number(b) - Number(a))
    : null;

  // Lógica de emisión y subida de PDF ya no se gestiona aquí, se trasladó a DocumentoPublico.jsx

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [documentosResult, clientesResult] = await Promise.all([
        supabase
          .from('documentos')
          .select('id, uuid, nombre_documento, estado, fecha_creacion, id_cliente_asignado, ruta_storage_pdf')
          .order('fecha_creacion', { ascending: false }),
        obtenerClientes()
      ]);

      if (documentosResult.error) throw documentosResult.error;
      setDocumentos(documentosResult.data);
      setClientes(clientesResult);
    } catch (error) {
      toast.error('Error al cargar los datos iniciales.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const getClientDisplay = (clientId) => {
    const cliente = clientes.find(c => c.id === clientId); // Buscar por id ahora
    if (!cliente) return 'ID no encontrado';
    return `${cliente.nombre} ${cliente.empresa ? `(${cliente.empresa})` : ''}`;
  };

  const getStatusChip = (status) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full text-white";
    switch (status) {
      case 'borrador': return `${baseClasses} bg-yellow-500`;
      case 'emitido': return `${baseClasses} bg-green-500`;
      case 'anulado': return `${baseClasses} bg-red-500`;
      default: return `${baseClasses} bg-gray-500`;
    }
  };
  
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  useEffect(() => {
    const cerrar = () => setMenuAbiertoId(null);
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, []);

  const handleEliminar = async (e, doc) => {
    e.stopPropagation();
    setMenuAbiertoId(null);
    if (!window.confirm(`¿Eliminar "${doc.nombre_documento}"? Esta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase.from('documentos').delete().eq('id', doc.id);
      if (error) throw error;
      toast.success('Documento eliminado.');
      cargarDatos();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar el documento.');
    }
  };

  const handleRowClick = (uuid) => {
    navigate(`/admin/documentos/${uuid}`);
  };

  const handleSeleccionarCliente = (clienteId) => {
    setFiltroCliente(String(clienteId));
    setFiltroAño('');
    setExpandedYears({});
  };

  const handleVolverAClientes = () => {
    setFiltroCliente('');
    setFiltroAño('');
    setExpandedYears({});
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Documentos</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#E80554] hover:bg-[#c50447] text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
          + Crear Nuevo Documento
        </button>
      </div>

      <CrearDocumentoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onDocumentoCreado={cargarDatos} clientes={clientes} />
      {/* ConfirmarEmisionModal ya no se usa aquí */}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Filtrar por cliente:</label>
        <select
          value={filtroCliente}
          onChange={(e) => { e.target.value ? handleSeleccionarCliente(e.target.value) : handleVolverAClientes(); }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos los clientes</option>
          {clientes.map(cliente => (
            <option key={cliente.id} value={String(cliente.id)}>
              {cliente.nombre}{cliente.empresa ? ` (${cliente.empresa})` : ''}
            </option>
          ))}
        </select>
        {filtroCliente && (
          <>
            <label className="text-sm font-semibold text-gray-700">Filtrar por año:</label>
            <select
              value={filtroAño}
              onChange={(e) => { setFiltroAño(e.target.value); setExpandedYears({}); }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos los años</option>
              {añosDisponibles.map(year => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {!filtroCliente && (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Clientes</h2>
            <div className="mt-2 h-1 w-16 rounded-full bg-[#25c6e3]"></div>
          </div>

          {isLoading ? (
            <div className="bg-white shadow-md rounded-2xl p-8 text-center text-gray-400">Cargando clientes...</div>
          ) : clientes.length === 0 ? (
            <div className="bg-white shadow-md rounded-2xl p-8 text-center text-gray-400">No hay clientes registrados.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientes.map(cliente => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => handleSeleccionarCliente(cliente.id)}
                  className="group min-h-[150px] rounded-2xl bg-gradient-to-br from-[#1a2f4e] to-[#2e527f] p-8 text-center shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:ring-2 hover:ring-[#25c6e3] focus:outline-none focus:ring-2 focus:ring-[#25c6e3]"
                >
                  <span className="block text-xl font-black text-white">{cliente.nombre}</span>
                  {cliente.empresa && (
                    <span className="mt-2 block text-sm font-semibold text-white/70">({cliente.empresa})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {filtroCliente && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleVolverAClientes}
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#1a2f4e] shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Volver a clientes
          </button>
        </div>
      )}

      {filtroCliente ? (
        isLoading ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center text-gray-400">Cargando datos...</div>
        ) : documentosPorAño.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center text-gray-400">
            {filtroAño ? 'Este cliente no tiene documentos en el año seleccionado.' : 'Este cliente no tiene documentos.'}
          </div>
        ) : (
          <div className="space-y-2">
            {documentosPorAño.map(([year, docs]) => (
              <div key={year} className="bg-white shadow-md rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="font-semibold text-gray-700">
                    {year} — {docs.length} documento{docs.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedYears[year] !== false ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedYears[year] !== false && (
                  <table className="min-w-full leading-normal">
                    <tbody>
                      {docs.map(doc => (
                        <tr key={doc.id} onClick={() => handleRowClick(doc.uuid)} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{doc.nombre_documento}</p></td>
                          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{getClientDisplay(doc.id_cliente_asignado)}</p></td>
                          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><span className={getStatusChip(doc.estado)}>{doc.estado}</span></td>
                          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(doc.fecha_creacion).toLocaleDateString()}</p></td>
                          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm" onClick={e => e.stopPropagation()}>
                            <div className="relative">
                              <button onClick={e => { e.stopPropagation(); setMenuAbiertoId(menuAbiertoId === doc.id ? null : doc.id); }} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 text-lg leading-none">⋮</button>
                              {menuAbiertoId === doc.id && (
                                <div className="absolute right-0 z-20 mt-1 w-36 rounded-md bg-white shadow-lg border border-gray-200">
                                  <button onClick={e => handleEliminar(e, doc)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">Eliminar</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="hidden bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha de Creación</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Cargando datos...</td></tr>
              ) : documentosFiltrados.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">No hay documentos para los filtros seleccionados.</td></tr>
              ) : documentosFiltrados.map(doc => (
                <tr key={doc.id} onClick={() => handleRowClick(doc.uuid)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{doc.nombre_documento}</p></td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{getClientDisplay(doc.id_cliente_asignado)}</p></td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><span className={getStatusChip(doc.estado)}>{doc.estado}</span></td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(doc.fecha_creacion).toLocaleDateString()}</p></td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <button onClick={e => { e.stopPropagation(); setMenuAbiertoId(menuAbiertoId === doc.id ? null : doc.id); }} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 text-lg leading-none">⋮</button>
                      {menuAbiertoId === doc.id && (
                        <div className="absolute right-0 z-20 mt-1 w-36 rounded-md bg-white shadow-lg border border-gray-200">
                          <button onClick={e => handleEliminar(e, doc)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">Eliminar</button>
                        </div>
                      )}
                    </div>
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

export default GestionDocumentos;
