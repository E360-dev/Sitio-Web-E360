import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useRol } from '../../hooks/useRol';
import { useCredenciales } from '../../context/CredencialesProvider';
import { puede } from '../../lib/permisos';
import {
  HomeIcon,
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  NewspaperIcon,
  BookOpenIcon
} from '@heroicons/react/24/solid';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { rol } = useRol();
  const { bloquear } = useCredenciales();

  const navLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Gesti\u00f3n de Documentos', href: '/admin/documentos', icon: DocumentDuplicateIcon, permiso: 'documentos' },
    { name: 'E360 Comunica', href: '/admin/comunica', icon: NewspaperIcon, permiso: 'comunica' },
    { name: 'Enviar Notificaci\u00f3n', href: '/admin/enviar-correo', icon: EnvelopeIcon, permiso: 'correo' },
    { name: 'Centro de Conocimiento', href: '/admin/conocimiento', icon: BookOpenIcon, permiso: 'conocimiento' },
  ].filter((link) => !link.permiso || puede(rol, link.permiso));

  const handleLogout = async () => {
    bloquear();
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="lg:sticky lg:top-0 lg:h-screen w-full lg:w-72 shrink-0 flex flex-col bg-white border-r border-gray-200 text-gray-700 shadow-xl z-20">
      <div className="hidden lg:flex flex-col items-center px-6 pt-8 pb-6 text-center">
        <p className="text-sm font-black tracking-[0.28em] text-[rgb(53,92,143)] uppercase">
          Panel de Control
        </p>
        <div className="mt-4 h-1 w-32 rounded-full bg-gradient-to-r from-[#e80554] to-[#25c6e3]"></div>
      </div>

      <nav className="lg:flex-1 flex lg:flex-col lg:justify-center gap-2 lg:gap-3 overflow-x-auto px-3 py-3 lg:px-4 lg:py-6">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.name}
              to={link.href}
              className={`group shrink-0 flex items-center justify-center px-4 py-3 text-sm rounded-xl transition-all duration-200 border-l-4 ${
                isActive
                  ? 'bg-[rgb(53,92,143)]/10 border-[rgb(53,92,143)] text-[rgb(53,92,143)] font-bold'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-[#1a2f4e] font-semibold'
              }`}
            >
              <link.icon className={`h-5 w-5 mr-4 transition-colors ${isActive ? 'text-[rgb(53,92,143)]' : 'text-gray-400 group-hover:text-[#1a2f4e]'}`} />
              <span className="tracking-wide">{link.name}</span>
            </Link>
          );
        })}

        {puede(rol, 'servidor') && (
        <div className="shrink-0 lg:pt-4 lg:border-t border-gray-200">
          <a
            href="http://3.151.184.227:8501"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center px-4 py-3 text-sm font-bold text-[#e80554] hover:bg-gray-50 rounded-xl transition-all border-l-4 border-transparent"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-4 text-[#e80554]" />
            <span className="tracking-wide text-xs">Abrir App UNC</span>
          </a>
        </div>
        )}
      </nav>

      <div className="flex flex-row lg:flex-col justify-between items-center gap-3 lg:gap-5 p-3 lg:p-6 border-t border-gray-200 text-center">
        <img src="/img/logo1.png" alt="E360" className="h-8 lg:h-20 w-auto opacity-95" />
        <button
          onClick={handleLogout}
          className="w-full max-w-56 flex items-center justify-center gap-3 px-4 py-3 bg-[#e80554] hover:bg-[#c70448] text-white text-xs font-black rounded-xl transition-all shadow-sm uppercase tracking-widest"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          {'Cerrar Sesi\u00f3n'}
        </button>
      </div>
    </aside>
  );
}
