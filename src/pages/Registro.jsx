import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    registrationCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');
    setLoading(true);

    const { email, password, fullName, registrationCode } = formData;

    // 1. Registrar el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('🔴 Error en Supabase Auth signUp:', authError);
      setError(
        `Error en la autenticación: ${authError.message}. ` +
        'Esto puede deberse a un problema con el trigger que inserta el usuario en la tabla de clientes. ' +
        'Revisa los logs de la base de datos en Supabase para más detalles.'
      );
      setLoading(false);
      return;
    }

    if (!authData.user) {
        setError('No se pudo crear el usuario. Por favor, inténtalo de nuevo.');
        setLoading(false);
        return;
    }

    // 2. Llamar a la función RPC para registrar los detalles del cliente
    const { error: rpcError } = await supabase.rpc('registrar_cliente_con_codigo', {
      p_user_id: authData.user.id,
      p_email: email,
      p_nombre: fullName,
      p_codigo: registrationCode,
    });

    if (rpcError) {
      console.error('🔴 Error completo al ejecutar RPC:', rpcError);

      setError(
        `Error en el registro: ${rpcError.message}\n` +
        (rpcError.details ? `Detalles: ${rpcError.details}\n` : '') +
        (rpcError.hint ? `Sugerencia: ${rpcError.hint}\n` : '')
      );
      setLoading(false);
      return; // Detener la ejecución si hay un error
    }
    // 3. Éxito y redirección
    setSuccessMessage('¡Registro completado con éxito! Serás redirigido en breve.');
    setTimeout(() => {
      navigate('/pendiente');
    }, 3000); // Redirige después de 3 segundos

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img className="mx-auto h-12 w-auto" src="/img/logo.png" alt="Logo" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Usa el código de registro que te proporcionó E360.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-e360-primary focus:border-e360-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-e360-primary focus:border-e360-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-e360-primary focus:border-e360-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="registrationCode" className="block text-sm font-medium text-gray-700">
                Código de Registro
              </label>
              <div className="mt-1">
                <input
                  id="registrationCode"
                  name="registrationCode"
                  type="text"
                  required
                  value={formData.registrationCode}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-e360-primary focus:border-e360-primary sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
                <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-e360-primary hover:bg-e360-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-e360-light disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
