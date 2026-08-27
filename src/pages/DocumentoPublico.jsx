import React, { useState, useEffect } from 'react';
import PdfViewer from '../components/PdfViewer';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { obtenerDocumentoPorUuid, generarUrlTemporalPdf } from '../lib/documentosApi';
import { 
  ShieldCheckIcon, 
  CalendarDaysIcon, 
  FingerPrintIcon, 
  InformationCircleIcon, 
  ExclamationCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRol } from '../hooks/useRol'; // Importar useRol como named export


const DocumentoPublico = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { rol, loading: loadingRol } = useRol();

  const [documento, setDocumento] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noPermitido, setNoPermitido] = useState(false);

  useEffect(() => {
    const cargarDocumento = async () => {
      if (!uuid) {
        setError("UUID del documento no proporcionado.");
        setLoading(false);
        return;
      }
      
      if (loadingRol) return;

      setLoading(true);
      setError(null);
      setNoPermitido(false);

      try {
        const docData = await obtenerDocumentoPorUuid(uuid);

        if (!docData) {
          setNoPermitido(true);
          setLoading(false);
          return;
        }
        
        setDocumento(docData);

        if (docData.estado === 'emitido' && docData.ruta_storage_pdf) {
          const url = await generarUrlTemporalPdf(docData.ruta_storage_pdf);
          setPdfUrl(url);
        } else if (docData.estado === 'emitido' && !docData.ruta_storage_pdf) {
          setError("El documento emitido no tiene un PDF asociado.");
        }
      } catch (err) {
        console.error("Error al cargar documento:", err);
        setNoPermitido(true); 
      } finally {
        setLoading(false);
      }
    };

    cargarDocumento();
  }, [uuid, loadingRol]);

  const handleBack = () => {
    if (rol === 'admin') navigate('/admin/dashboard'); 
    else if (rol === 'cliente') navigate('/cliente/dashboard');
    else navigate(-1); 
  };

  const scrollToViewer = () => {
    const viewer = document.getElementById('pdf-viewer');
    if (viewer) viewer.scrollIntoView({ behavior: 'smooth' });
  };

  const getDashboardLink = () => {
    if (rol === 'admin') return '/admin/dashboard';
    if (rol === 'cliente') return '/cliente/dashboard';
    return '/';
  };

  const getDocumentsLink = () => {
    if (rol === 'admin') return '/admin/documentos';
    if (rol === 'cliente') return '/cliente/dashboard'; // Los clientes ven sus documentos en su dashboard principal
    return '/login';
  };

  if (loading || loadingRol) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <img src="/img/logo1.png" alt="E360 Logo" className="h-20 mb-4 opacity-50" />
          <p className="text-gray-500 font-medium">Cargando documento institucional...</p>
        </div>
      </div>
    );
  }

  if (error || noPermitido || !documento || (documento.estado !== 'emitido' && documento.estado !== 'borrador')) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {error ? "Error" : noPermitido ? "Acceso No Autorizado" : "Documento no Disponible"}
        </h1>
        <p className="text-gray-600 max-w-md">
          {error || (noPermitido ? "No tiene permisos para ver este documento o no existe." : "Este documento no ha sido emitido o no está accesible en este momento.")}
        </p>
        <button onClick={handleBack} className="mt-6 px-6 py-2 bg-e360-primary text-white rounded-full hover:bg-e360-dark transition-colors">
          Regresar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans">
      {/* Header Institucional Limpio */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-12 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to={getDashboardLink()}>
              <img src="/img/logo1.png" alt="E360 Logo" className="h-12 md:h-16" />
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-gray-600">
              <Link to={getDocumentsLink()} className="cursor-pointer hover:text-e360-primary transition-colors">
                Mis documentos
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to={getDashboardLink()} 
              className="px-6 py-1.5 border-2 border-e360-cyan text-e360-cyan font-bold rounded-full text-sm hover:bg-e360-cyan hover:text-white transition-all duration-300"
            >
              INICIO
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Portada del Documento */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          
          {/* Columna Izquierda: Información del Documento */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              {/* Línea Decorativa */}
              <div className="flex h-1 w-24 rounded-full overflow-hidden">
                <div className="w-1/2 bg-e360-cyan"></div>
                <div className="w-1/2 bg-e360-highlight"></div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {documento.nombre_documento}
              </h1>
              
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-600">
                  Estados financieros dictaminados
                </h2>
                <p className="text-gray-500 text-sm">
                  Fecha de publicación: <span className="font-semibold text-gray-700">
                    {documento.estado === 'emitido' ? new Date(documento.fecha_emision).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pendiente'}
                  </span>
                </p>
              </div>
            </div>

            {/* Bloque Informativo con Imagen y Overlay */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl min-h-[250px] flex items-center p-8 md:p-12">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: "url('/img/servicios2.png')" }}
              ></div>
              <div className="absolute inset-0 bg-e360-primary/85 mix-blend-multiply"></div>
              
              <div className="relative z-10 max-w-2xl space-y-4">
                <p className="text-white text-sm md:text-base leading-relaxed opacity-95">
                  El presente documento fue emitido por <span className="font-bold">E360</span> (Enlace Consultores Financieros SAS), bajo la responsabilidad del cliente a través de los ejecutivos que lo suscriben, y fue verificado por nuestros socios. Si desea corroborar parcial o totalmente dicho documento, a continuación la copia fiel del mismo.
                </p>
                <p className="text-white text-sm md:text-base leading-relaxed opacity-95">
                  Para más información póngase en contacto al correo <span className="underline font-medium text-e360-cyan">info@e360.pro</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <ShieldCheckIcon className="h-5 w-5 text-e360-cyan" />
              <span>Documento emitido y verificado por el equipo de E360</span>
            </div>

            {/* CTA Inferior */}
            <div className="pt-4">
              <button 
                onClick={scrollToViewer}
                className="group flex items-center space-x-3 text-e360-primary font-bold text-lg hover:text-e360-cyan transition-colors"
              >
                <span>PREVISUALIZAR DOCUMENTO</span>
                <div className="p-2 rounded-full border-2 border-e360-primary group-hover:border-e360-cyan transition-colors">
                  <ArrowLeftIcon className="h-5 w-5 rotate-[270deg]" />
                </div>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Bloque Institucional (Card Flotante) */}
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="bg-white rounded-3xl p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-col items-center text-center space-y-6">
              <div className="space-y-2 flex flex-col items-center">
                <p className="text-gray-500 font-medium tracking-wide uppercase text-xs">Documento en Emisión</p>
                <img src="/img/logo1.png" alt="E360 Logo" className="h-32 md:h-40 max-w-full object-contain" />
              </div>
              
              <div className="w-12 h-1 bg-gray-100 rounded-full"></div>
              
              <div className="pt-4 flex flex-col items-center space-y-4">
                {documento.estado === 'emitido' && (
                  <div className="flex flex-col items-center space-y-1 group relative">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID de Seguimiento</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(documento.uuid);
                        alert("ID completo copiado al portapapeles");
                      }}
                      className="flex items-center text-e360-primary font-mono text-sm bg-gray-50 px-3 py-1 rounded-md border border-gray-100 hover:bg-e360-cyan/5 hover:border-e360-cyan/30 transition-all cursor-pointer"
                      title="Clic para copiar ID completo"
                    >
                      <FingerPrintIcon className="h-3 w-3 mr-2" />
                      {documento.uuid.split('-')[0].toUpperCase()}...
                    </button>

                    {/* Tooltip Explicativo */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-64 bg-gray-900 text-white p-4 rounded-xl shadow-2xl z-50 text-left">
                      <div className="space-y-2">
                        <p className="font-bold text-xs border-b border-gray-700 pb-1 flex items-center">
                          <InformationCircleIcon className="h-3 w-3 mr-1 text-e360-cyan" />
                          ¿Qué es este ID?
                        </p>
                        <p className="text-[10px] leading-relaxed text-gray-300">
                          Es el <span className="text-white font-medium">UUID (Identificador Único Universal)</span>. Funciona como la "matrícula digital" de este documento en E360, garantizando que este registro es único, legítimo e inalterable en nuestros sistemas.
                        </p>
                        <div className="bg-gray-800 p-2 rounded text-[9px] font-mono break-all text-e360-cyan">
                          {documento.uuid}
                        </div>
                        <p className="text-[9px] text-center text-gray-500 italic mt-1">Haz clic para copiar el código completo</p>
                      </div>
                      {/* Flecha del tooltip */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold ${documento.estado === 'emitido' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {documento.estado === 'emitido' ? 'CERTIFICADO VÁLIDO' : 'EN PROCESO'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección del Visor (Desplazada hacia abajo) */}
        <section id="pdf-viewer" className="pt-12 border-t border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              <DocumentTextIcon className="h-7 w-7 mr-3 text-e360-primary" />
              Vista del Documento
            </h3>
            {documento.estado === 'emitido' && (
              <span className="text-sm text-gray-500 flex items-center">
                <FingerPrintIcon className="h-4 w-4 mr-1" />
                ID: {documento.uuid.split('-')[0]}...
              </span>
            )}
          </div>

          {documento.estado === 'borrador' ? (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-12 md:p-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping h-full w-full rounded-full bg-blue-400 opacity-20"></div>
                <InformationCircleIcon className="h-20 w-20 text-e360-primary relative z-10" />
              </div>
              <div className="max-w-md space-y-3">
                <h3 className="text-2xl font-bold text-e360-dark">Documento en Preparación</h3>
                <p className="text-gray-600 leading-relaxed">
                  El código QR es válido. El equipo de <span className="font-semibold">E360</span> está finalizando la carga y firma digital del archivo oficial. Por favor, regrese en unos momentos.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 h-[80vh] group relative">
              {pdfUrl ? (
                <PdfViewer url={pdfUrl} title={documento.nombre_documento} />
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-gray-400 space-y-4">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-200" />
                  <p>No se pudo cargar el visor del PDF.</p>
                </div>
              )}

              {/* Overlay de protección visual (Opcional) */}
              <div className="absolute inset-0 pointer-events-none border-[12px] border-white/50 rounded-2xl"></div>
            </div>
          )}

          {/* Pie de Documento con Metadatos */}
          {documento.estado === 'emitido' && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-100 rounded-xl p-6 text-sm">
              <div className="flex items-start space-x-3">
                <CalendarDaysIcon className="h-5 w-5 text-e360-primary mt-0.5" />
                <div>
                  <p className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">Fecha de Emisión</p>
                  <p className="text-gray-600">{new Date(documento.fecha_emision).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group relative cursor-help">
                <FingerPrintIcon className="h-5 w-5 text-e360-primary mt-0.5" />
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">Firma Digital (Hash SHA-256)</p>
                  <p className="text-gray-600 truncate font-mono">{documento.hash_documento || 'No generado'}</p>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-3 hidden group-hover:block bg-gray-900 text-white p-3 rounded-lg shadow-2xl w-72 z-30 text-xs leading-relaxed">
                  <p className="font-bold mb-1">Certificación de Integridad</p>
                  <p className="opacity-80 text-[11px]">Este código es el resultado de un algoritmo criptográfico que garantiza que el archivo no ha sido modificado desde su emisión original por E360.</p>
                  <div className="absolute top-full left-4 border-8 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer Institucional */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-4">
            <img src="/img/logo.png" alt="E360" className="h-10 grayscale opacity-40" />
            <div className="h-8 w-px bg-gray-200"></div>
            <p className="text-xs text-gray-400 max-w-xs uppercase tracking-widest font-bold">
              Enlace Consultores Financieros
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} E360 Digital Trust Services</p>
            <p className="text-[9px] text-gray-300 mt-1 uppercase tracking-widest">Documento con validez probatoria electrónica</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentoPublico;