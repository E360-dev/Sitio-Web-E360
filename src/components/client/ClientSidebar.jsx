import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useState, useEffect } from 'react';
import { HomeIcon, ArrowLeftOnRectangleIcon, GlobeAltIcon, DocumentTextIcon } from '@heroicons/react/24/solid';

export default function ClientSidebar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    { name: 'Mis Documentos', href: '/cliente/documentos', icon: DocumentTextIcon },
  ];

  return (
    <aside className="w-72 flex flex-col bg-[#2e527f] text-white shadow-2xl z-20">
      {/* Header con Logo */}
      <div className="pt-12 pb-10 flex flex-col items-center border-b border-white/10 px-6">
        <img src="/img/logo.png" alt="E360" className="h-24 w-auto brightness-0 invert opacity-90" />
        <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold">Portal de Cliente</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-8 space-y-4">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={`group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 border-l-4 ${
                isActive 
                  ? 'bg-white/10 border-[#25c6e3] text-white shadow-inner' 
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <link.icon className={`h-5 w-5 mr-4 transition-colors ${isActive ? 'text-[#25c6e3]' : 'text-white/40 group-hover:text-white'}`} />
              <span className="tracking-wide">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-6 border-t border-white/10 bg-[#1e3a5f]/50">
        <div className="mb-6 px-2">
          <p className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1">Cuenta</p>
          <p className="text-sm font-bold text-white truncate">{user?.email?.split('@')[0] || 'Usuario'}</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#e80554] hover:bg-[#c70448] text-white text-sm font-black rounded-xl transition-all shadow-lg hover:shadow-[#e80554]/20 transform active:scale-95 uppercase tracking-widest"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
