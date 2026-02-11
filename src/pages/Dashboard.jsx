import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import Fideicomisos from '../components/Fideicomisos.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate('/login'); // Redirige si no hay usuario
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Redirige a la página de inicio después de cerrar sesión
  };

  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-24">
      <div className="bg-e360-primary shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Dashboard de Cliente</h1>
          <button
            onClick={handleLogout}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-e360-primary bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-e360-dark focus:ring-white"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h2>
              <p className="mt-2 text-gray-600">
                Has iniciado sesión correctamente. Tu correo es: <span className="font-medium">{user.email}</span>
              </p>
              <p className="mt-1 text-gray-600">
                Este es tu panel de cliente. Próximamente verás aquí la información de tu auditoría.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Fideicomisos />
          </div>
        </div>
      </main>
    </div>
  );
}
