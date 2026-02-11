import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useState, useEffect } from 'react';
import { HomeIcon, ArrowLeftOnRectangleIcon, DocumentChartBarIcon, GlobeAltIcon, DocumentTextIcon } from '@heroicons/react/24/solid'; // DocumentTextIcon añadido

export default function ClientSidebar() {
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
    navigate('/login');
  };

  const navLinks = [
    { name: 'Sitio Web', href: '/', icon: GlobeAltIcon },
    { name: 'Dashboard', href: '/cliente/dashboard', icon: HomeIcon },
    { name: 'Mis Documentos', href: '/cliente/documentos', icon: DocumentTextIcon }, // Nuevo enlace
  ];

  return (
    <aside className="w-64 flex flex-col bg-gray-800 text-white">
      <div className="h-28 flex items-center justify-center border-b border-gray-700 px-4">
        <img src="/img/logo.png" alt="E360" className="h-20" />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
          >
            <link.icon className="h-6 w-6 mr-3" />
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-6 border-t border-gray-700">
        <div className="mb-4">
          <p className="text-sm font-medium text-white">{user?.email}</p>
          <p className="text-xs text-gray-400">Cliente</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-left text-red-400 rounded-md hover:bg-red-500 hover:text-white transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
