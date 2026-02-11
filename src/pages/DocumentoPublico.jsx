import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { obtenerDocumentoPorUuid, generarUrlTemporalPdf } from '../lib/documentosApi';
import { ShieldCheckIcon, CalendarDaysIcon, FingerPrintIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';


const DocumentoPublico = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [documento, setDocumento] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [noPermitido, setNoPermitido] = useState(false);

  // Efecto para verificar la autenticación y obtener el usuario
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        navigate('/login'); // Redirigir a login si no hay sesión
      } else {
        setCurrentUser(session.user);
      }
      setLoadingUser(false);
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    const cargarDocumento = async () => {
      if (!uuid) {
        setError("UUID del documento no proporcionado.");
        setLoading(false);
        return;
      }
      
      // Esperar a que el usuario termine de cargar
      if (loadingUser || !currentUser) return;

      setLoading(true);
      setError(null);
      setNoPermitido(false);

      try {
        const docData = await obtenerDocumentoPorUuid(uuid);

        if (!docData) { // Si RLS impidió el fetch para este usuario
          setNoPermitido(true);
          setLoading(false);
          return;
        }
        
        // --- Lógica de Validación de Acceso ---
        // 1. Verificar estado del documento
        if (docData.estado !== 'emitido') {
          setError("Este documento no ha sido emitido y no puede visualizarse.");
          setLoading(false);
          return; 
        }

        // La validación de pertenencia se deja completamente a la RLS de la base de datos.
        // Si obtenerDocumentoPorUuid devuelve docData, es que el usuario tiene acceso por RLS.
        // --- Fin Lógica de Validación de Acceso ---

        setDocumento(docData);

        if (docData.ruta_storage_pdf) {
          const url = await generarUrlTemporalPdf(docData.ruta_storage_pdf);
          setPdfUrl(url);
        } else {
          setError("El documento emitido no tiene un PDF asociado.");
        }
      } catch (err) {
        console.error("Error detallado al cargar el documento en DocumentoPublico:", err); // Debug: console.error
        // Si hay un error, asumimos que es por falta de acceso o el documento no existe/es inaccesible
        setNoPermitido(true); 
      } finally {
        setLoading(false);
      }
    };

    cargarDocumento();
  }, [uuid, currentUser, loadingUser, navigate]);

  if (loading || loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-700">Cargando documento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <InformationCircleIcon className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
        <p className="text-gray-600 text-center">{error}</p>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">Volver a Inicio</Link>
      </div>
    );
  }

  // Mensaje de acceso no permitido
  if (noPermitido) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <ExclamationCircleIcon className="h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso No Autorizado</h1>
        <p className="text-gray-600 text-center">
          Usted no tiene permisos para visualizar este documento o no existe.
        </p>
        <Link to="/login" className="mt-4 text-blue-600 hover:underline">Volver a Login</Link>
      </div>
    );
  }

  // Guard explícito para documentos no emitidos (redundante si el error ya se ha establecido, pero buena práctica)
  if (!documento || documento.estado !== 'emitido') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <InformationCircleIcon className="h-12 w-12 text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Documento no Disponible</h1>
        <p className="text-gray-600 text-center">
          Este documento no ha sido emitido o no está accesible en este momento.
        </p>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">Volver a Inicio</Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold";
    switch (status) {
      case 'emitido':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}><ShieldCheckIcon className="h-4 w-4 mr-2" /> Emitido</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Estado desconocido</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* Header con branding */}
      <header className="bg-white shadow p-4 md:p-6 text-center">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          {/* Placeholder para el logo */}
          <img src="/img/logo.png" alt="Logo de la Firma" className="h-10 mr-3" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Firma de Auditoría E360</h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{documento.nombre_documento}</h2>
            {getStatusBadge(documento.estado)}
          </div>

          <p className="text-gray-600 text-sm mb-4">
            {/* Placeholder para descripción breve */}
            Este documento ha sido emitido por la firma de auditoría y su contenido ha sido certificado.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm text-gray-700">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-500" />
              <span>Fecha de Emisión: {new Date(documento.fecha_emision).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <FingerPrintIcon className="h-5 w-5 mr-2 text-gray-500" />
              <span className="truncate">Hash SHA-256: {documento.hash_documento}</span>
            </div>
          </div>

          {/* PDF Embebido */}
          <div className="border border-gray-300 rounded-lg overflow-hidden h-[70vh] mb-6">
            {pdfUrl ? (
              <iframe src={pdfUrl} title={documento.nombre_documento} className="w-full h-full" />
            ) : (
              <div className="flex justify-center items-center h-full bg-gray-100 text-gray-500">
                <InformationCircleIcon className="h-6 w-6 mr-2" />
                No se pudo cargar el PDF asociado.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer legal simple */}
      <footer className="bg-gray-800 text-white text-center p-4 text-xs">
        <p>&copy; {new Date().getFullYear()} Firma de Auditoría E360. Todos los derechos reservados.</p>
        <p>Este es un documento probatorio emitido electrónicamente.</p>
      </footer>
    </div>
  );
};

export default DocumentoPublico;