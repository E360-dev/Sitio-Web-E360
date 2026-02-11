import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Fideicomisos from '../components/Fideicomisos.jsx'; 
import { useNavigate } from 'react-router-dom';

export default function ClientView() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login'); // Redirige a login tras cerrar sesión
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="pt-24">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Cliente</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Fideicomisos />
        </main>
      </div>
    </div>
  );
}
