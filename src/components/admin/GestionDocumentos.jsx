import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { obtenerClientes, crearDocumentoBorrador } from '../../lib/documentosApi'; // EmitirDocumento, SubirPdfYAsociar ya no se usan directamente aquí
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate


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
                <option key={cliente.id} value={cliente.user_id}>{cliente.nombre} {cliente.empresa ? `(${cliente.empresa})` : ''}</option>
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
    const cliente = clientes.find(c => c.user_id === clientId); // Buscar por user_id ahora
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
  
  // Función para manejar el click en la fila
  const handleRowClick = (uuid) => {
    navigate(`/admin/documentos/${uuid}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Documentos</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
          + Crear Nuevo Documento
        </button>
      </div>

      <CrearDocumentoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onDocumentoCreado={cargarDatos} clientes={clientes} />
      {/* ConfirmarEmisionModal ya no se usa aquí */}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha de Creación</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" className="text-center py-8">Cargando datos...</td></tr>
            ) : documentos.map(doc => (
              <tr key={doc.id} onClick={() => handleRowClick(doc.uuid)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{doc.nombre_documento}</p></td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{getClientDisplay(doc.id_cliente_asignado)}</p></td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><span className={getStatusChip(doc.estado)}>{doc.estado}</span></td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(doc.fecha_creacion).toLocaleDateString()}</p></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionDocumentos;