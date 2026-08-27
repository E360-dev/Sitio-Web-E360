import React, { useState, useEffect } from 'react';
import PdfViewer from '../../components/PdfViewer';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { obtenerDocumentoPorUuid, generarUrlTemporalPdf } from '../../lib/documentosApi';
import { ArrowLeftIcon, ShieldCheckIcon, DocumentTextIcon, UserCircleIcon, CalendarDaysIcon, FingerPrintIcon, ExclamationTriangleIcon, InformationCircleIcon, KeyIcon } from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200">
    <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
      <Icon className="h-5 w-5 mr-2 text-gray-400" />
      {label}
    </dt>
    <dd className="mt-1 text-sm text-gray-900 font-semibold break-words">{value || 'No disponible'}</dd>
  </div>
);

const VistaDocumentoAdmin = () => {
  const { uuid } = useParams();
  const [documento, setDocumento] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarTodo = async () => {
      if (!uuid) return;
      setLoading(true);
      setError(null);
      try {
        const docData = await obtenerDocumentoPorUuid(uuid);
        setDocumento(docData);

        if (docData.ruta_storage_pdf) {
          const url = await generarUrlTemporalPdf(docData.ruta_storage_pdf);
          setPdfUrl(url);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarTodo();
  }, [uuid]);
  
  const getStatusChip = (status) => {
    const chipStyles = {
      emitido: { bg: 'bg-green-100', text: 'text-green-800', icon: ShieldCheckIcon },
      anulado: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationTriangleIcon },
    };
    const style = chipStyles[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    const Icon = style.icon;
    return (
      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${style.bg} ${style.text}`}>
        {Icon && <Icon className="h-5 w-5 mr-2" />}
        {status.toUpperCase()}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando documento...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error al Cargar el Documento</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Link to="/admin/documentos" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a Gestión
        </Link>
      </div>
    );
  }

  // Guard explícito para documentos que no están en estado 'emitido'
  if (documento && documento.estado !== 'emitido') {
    return (
      <div className="p-8 text-center">
        <InformationCircleIcon className="mx-auto h-12 w-12 text-blue-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Vista no disponible</h2>
        <p className="text-gray-600 mt-2">
          Este documento se encuentra en estado <span className="font-bold">'{documento.estado}'</span> y no puede ser visualizado en esta vista probatoria.
        </p>
        <Link to="/admin/documentos" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a Gestión
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/admin/documentos" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver a Gestión de Documentos
          </Link>
        </div>

        <header className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">{documento.nombre_documento}</h1>
              <p className="text-sm text-gray-500 mt-1">UUID: {documento.uuid}</p>
            </div>
            <div className="mt-4 md:mt-0">
              {getStatusChip(documento.estado)}
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg h-[80vh] overflow-hidden">
              {pdfUrl ? (
                <PdfViewer url={pdfUrl} title={documento.nombre_documento} />
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500">Este documento no tiene un PDF asociado.</div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Detalles de Emisión</h2>
            <StatCard icon={DocumentTextIcon} label="UUID del Documento" value={documento.uuid} />
            <StatCard icon={CalendarDaysIcon} label="Fecha de Emisión" value={new Date(documento.fecha_emision).toLocaleString()} />
            <StatCard icon={FingerPrintIcon} label="Hash SHA-256" value={documento.hash_documento} />
            <hr/>
            <StatCard icon={KeyIcon} label="ID Cliente Asignado" value={documento.id_cliente_asignado} />
            <StatCard icon={KeyIcon} label="ID Admin Emisor" value={documento.emitido_por} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaDocumentoAdmin;