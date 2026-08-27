import { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Re-using the existing Supabase client

export default function LeadForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('monday-contact', {
        body: formData,
      });

      if (functionError) {
        throw new Error(functionError.message);
      }
      
      if (data.ok) {
        setSuccess(`¡Gracias por tu interés! Tu solicitud ha sido registrada con el ID: ${data.monday_item_id}. Nos pondremos en contacto pronto.`);
        setFormData({ nombre: '', email: '', telefono: '', empresa: '', mensaje: '' }); // Clear form
      } else {
        throw new Error(data.message || 'Ocurrió un error inesperado al procesar tu solicitud.');
      }

    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Contáctanos
        </h1>
        <p className="mt-4 text-lg leading-6 text-gray-500">
          ¿Listo para empezar? Completa el formulario y nos pondremos en contacto contigo.
        </p>
      </div>
      <div className="mt-10">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="nombre"
                id="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="py-3 px-4 block w-full shadow-sm focus:ring-e360-primary focus:border-e360-primary border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="py-3 px-4 block w-full shadow-sm focus:ring-e360-primary focus:border-e360-primary border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label htmlFor="empresa" className="block text-sm font-medium text-gray-700">
              Empresa
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="empresa"
                id="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className="py-3 px-4 block w-full shadow-sm focus:ring-e360-primary focus:border-e360-primary border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="telefono"
                id="telefono"
                autoComplete="tel"
                value={formData.telefono}
                onChange={handleChange}
                className="py-3 px-4 block w-full shadow-sm focus:ring-e360-primary focus:border-e360-primary border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700">
              Mensaje
            </label>
            <div className="mt-1">
              <textarea
                id="mensaje"
                name="mensaje"
                rows={4}
                value={formData.mensaje}
                onChange={handleChange}
                className="py-3 px-4 block w-full shadow-sm focus:ring-e360-primary focus:border-e360-primary border-gray-300 rounded-md"
              />
            </div>
          </div>

          {success && (
            <div className="sm:col-span-2 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="sm:col-span-2 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-e360-primary hover:bg-e360-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-e360-light disabled:bg-gray-400"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
