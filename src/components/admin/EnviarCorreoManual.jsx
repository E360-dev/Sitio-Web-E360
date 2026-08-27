import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  ArrowPathIcon, 
  PaperAirplaneIcon,
  PhotoIcon,
  LinkIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const EnviarCorreoManual = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    nombre_documento: '',
    link_documento: '',
    correos_to: '',
    correos_cc: ''
  });
  const [qrImage, setQrImage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Solo se permiten imágenes JPG o PNG.');
        e.target.value = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande (máximo 5MB).');
        e.target.value = null;
        return;
      }
      setQrImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.link_documento.startsWith('http')) {
      toast.error('El link debe empezar con http:// o https://');
      return;
    }
    if (!qrImage) {
      toast.error('La imagen del QR es requerida.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Enviando correo...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa.');

      const dataToSend = new FormData();
      dataToSend.append('nombre_cliente', formData.nombre_cliente);
      dataToSend.append('nombre_documento', formData.nombre_documento);
      dataToSend.append('link_documento', formData.link_documento);
      dataToSend.append('correos_to', formData.correos_to);
      dataToSend.append('correos_cc', formData.correos_cc);
      dataToSend.append('qr_image', qrImage);

      const response = await fetch('https://crxtzmykprgbgkdbqccd.functions.supabase.co/enviar-correo-manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: dataToSend
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('¡Correo enviado con éxito!', { id: toastId });
        // Limpiar formulario
        setFormData({
          nombre_cliente: '',
          nombre_documento: '',
          link_documento: '',
          correos_to: '',
          correos_cc: ''
        });
        setQrImage(null);
        e.target.reset();
      } else {
        const errorMsg = result.error || 'Error al enviar el correo.';
        const errorDetails = result.details ? ` | Detalles: ${result.details}` : '';
        console.error('Error detallado de la función:', result);
        throw new Error(`${errorMsg}${errorDetails}`);
      }
    } catch (error) {
      console.error('Error enviando correo manual:', error);
      toast.error(error.message, { id: toastId, duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <EnvelopeIcon className="h-8 w-8 text-blue-600" />
          Enviar correo dictamen emitido
        </h1>
        <p className="text-gray-600 mt-2">
          Utilice este formulario para enviar notificaciones de documentos con QR personalizado.
        </p>
      </div>

      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                Nombre del Cliente
              </label>
              <input
                required
                type="text"
                name="nombre_cliente"
                value={formData.nombre_cliente}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ej. Juan Pérez / Empresa S.A."
              />
            </div>

            {/* Nombre Documento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                Nombre del Documento
              </label>
              <input
                required
                type="text"
                name="nombre_documento"
                value={formData.nombre_documento}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ej. Dictamen Anual 2023"
              />
            </div>
          </div>

          {/* Link Documento */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              Link del Documento (URL Pública)
            </label>
            <input
              required
              type="url"
              name="link_documento"
              value={formData.link_documento}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="https://e360.com/documento/..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Correos To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Para (Correos separados por coma)
              </label>
              <textarea
                required
                name="correos_to"
                value={formData.correos_to}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="ejemplo@correo.com, otro@correo.com"
              />
            </div>

            {/* Correos CC */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CC (Copia opcional)
              </label>
              <textarea
                name="correos_cc"
                value={formData.correos_cc}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="admin@e360.com"
              />
            </div>
          </div>

          {/* Imagen QR */}
          <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <PhotoIcon className="h-5 w-5 text-blue-500" />
              Imagen del Código QR (JPG/PNG)
            </label>
            <div className="flex flex-col items-center">
              <input
                required
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-xs text-gray-400">Máximo 5MB. Formatos permitidos: .jpg, .png</p>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-95'
                }
              `}
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Enviar Correo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnviarCorreoManual;
