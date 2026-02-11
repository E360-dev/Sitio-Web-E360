import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useState, useEffect } from 'react';
import { HomeIcon, UserGroupIcon, DocumentChartBarIcon, ArrowLeftOnRectangleIcon, ClipboardDocumentListIcon, ClipboardDocumentCheckIcon, ArrowTopRightOnSquareIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid';

export default function AdminSidebar() {
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
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Gestión de Documentos', href: '/admin/documentos', icon: DocumentDuplicateIcon },
  ];

  return (
    <aside className="w-64 flex flex-col bg-gray-900 text-white">
      <div className="h-28 flex items-center justify-center border-b border-gray-800 px-4">
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
        {/* Enlace a la App externa */}
        <a
          href="http://3.151.184.227:8501"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-6 w-6 mr-3" />
          Abrir App UNC
        </a>
      </nav>

      <div className="px-4 py-6 border-t border-gray-800">
        <div className="mb-4">
          <p className="text-sm font-medium text-white">{user?.email}</p>
          <p className="text-xs text-yellow-400">Administrador</p>
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
