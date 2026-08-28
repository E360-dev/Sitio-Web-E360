import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Imagen from './Imagen';

const logo = '/img/logo1.png';

// --- Iconos para TODOS los Menús ---
const DiferenciadoresIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.5 21.75l-.398-1.188a3.375 3.375 0 00-2.924-2.924l-1.188-.398 1.188-.398a3.375 3.375 0 002.924-2.924l.398-1.188.398 1.188a3.375 3.375 0 002.924 2.924l1.188.398-1.188.398a3.375 3.375 0 00-2.924 2.924z" /></svg>;
const ImpactoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
const PresenciaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const EnfoqueHumanoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PropositoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>;
const EquipoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.054 1.022.096 1.534.126m-1.534-.126V18a2.25 2.25 0 01-2.25-2.25m1.534-.126a2.25 2.25 0 00-2.25-2.25m2.25 2.25V15m1.534-.126a2.25 2.25 0 012.25-2.25m-2.25 2.25a2.25 2.25 0 002.25 2.25m-2.25-2.25V6a2.25 2.25 0 012.25-2.25m-2.25 2.25a2.25 2.25 0 00-2.25 2.25m0 0V15m0-9.75a2.25 2.25 0 012.25-2.25M12 15v2.25m0-2.25a2.25 2.25 0 00-2.25-2.25M15 15v2.25m0-2.25a2.25 2.25 0 01-2.25-2.25m-2.25-2.25a2.25 2.25 0 00-2.25 2.25m-2.25 2.25V15m2.25 2.25v-2.25m2.25 2.25a2.25 2.25 0 01-2.25 2.25m-2.25-2.25a2.25 2.25 0 00-2.25 2.25m2.25 2.25V15" /></svg>;
const OportunidadesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const ConocimientoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const DominioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-2.176-2.177m2.176 2.177l2.176 2.177m15.482-4.354l2.176 2.177-2.176-2.177m-15.482 4.354l2.176 2.177 15.482-11.027-2.176-2.177-15.482 11.027z" /></svg>;
const ConsultoriaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197" /></svg>;
const AuditoriaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>;
const FiscalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414-.336.75-.75.75h-.75m0-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TecnologiaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>;

// --- Datos completos del Menú ---
const submenuData = {
  inicio: [
    { name: 'Cercanía Humana', description: 'ADN Big Four, Cercanía Humana.', href: '/#cercania-humana', icon: EnfoqueHumanoIcon },
    { name: 'Impacto', description: 'Resultados medibles y casos de éxito.', href: '/#impacto', icon: ImpactoIcon },
    { name: 'Presencia', description: 'Nuestra cobertura y alcance global.', href: '/#presencia', icon: PresenciaIcon },
  ],
  servicios: [
    { name: 'Consultoría Financiera e Impuestos', description: 'Optimización y estrategias tributarias.', href: '/servicios#consultoria', icon: ConsultoriaIcon },
    { name: 'Financiamiento y Estructuración', description: 'Preparación para fondeo y capital.', href: '/servicios#financiamiento', icon: FiscalIcon },
    
  ],
  nosotros: [
    { name: 'Propósito y Valores', description: 'El ADN que impulsa nuestras acciones.', href: '/nosotros#purpose-values', icon: PropositoIcon },
    { name: 'Nuestro Equipo', description: 'Conoce a los líderes detrás de E360.', href: '/nosotros#equipo', icon: EquipoIcon },
  ],
  
};

const mainMenuItems = [
  { name: 'Inicio', href: '/' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'Nosotros', href: '/nosotros' },
  
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState('');
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState('');
  const [highlightStyle, setHighlightStyle] = useState({});
  const dropdownRefs = useRef({});
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    
    window.addEventListener('scroll', handleScroll);
    
    // Call handler once to set initial state on page load/navigation
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const handleMouseEnter = (e, menuName) => {
    const dropdownNode = dropdownRefs.current[menuName];
    if (!dropdownNode) return;
    const { top, left } = dropdownNode.getBoundingClientRect();
    const { top: itemTop, left: itemLeft, width, height } = e.currentTarget.getBoundingClientRect();
    setHighlightStyle({
      transform: `translate(${itemLeft - left}px, ${itemTop - top}px)`,
      width: `${width}px`,
      height: `${height}px`,
      opacity: 1,
    });
  };

  const getNavLinkClass = (path) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return `relative px-3 py-1 font-bold hover:text-[rgb(138,218,233)] transition-all duration-300 rounded-md border-2 [text-shadow:0px_0px_1px_rgba(0,0,0,0.2)] ${
      isActive 
        ? 'text-[rgb(138,218,233)] border-[rgb(138,218,233)]' 
        : 'text-[rgb(74,74,76)] border-transparent'
    }`;
  };

  const isHomePage = location.pathname === '/';
  const navBarClass = `fixed top-0 left-0 w-full z-50 transition-all duration-300 ${mobileMenuOpen ? 'bg-[rgb(239,239,239)]' : 'bg-[rgb(239,239,239)] shadow-[0_30px_50px_-25px_rgba(0,0,0,0.5)]'}`;

  return (
    <header className={navBarClass}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex-shrink-0"><Imagen className={`w-auto transition-all duration-300 transform origin-left ${scrolled ? 'scale-100 h-16' : 'scale-150 h-16'}`} src={logo} alt="Logo E360" lazy={false} /></Link>

          <div className="hidden md:flex items-center space-x-8">
            {mainMenuItems.map((item) => (
              <div key={item.name} className="relative" onMouseEnter={() => setOpenDropdown(item.name.toLowerCase())} onMouseLeave={() => setOpenDropdown('')}>
                <NavLink to={item.href} className={getNavLinkClass(item.href)}>
                  {item.name}
                </NavLink>
                
                <div className={`absolute top-full origin-top-right transition-all duration-300 ease-out ${openDropdown === item.name.toLowerCase() ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div className="mt-4" onMouseLeave={() => setHighlightStyle({ ...highlightStyle, opacity: 0 })}>
                    <div 
                      ref={el => dropdownRefs.current[item.name.toLowerCase()] = el} 
                      className={`relative bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl ring-1 ring-white/10 p-2 ${item.name === 'Servicios' ? 'w-80 grid grid-cols-1 gap-1' : 'w-80 grid grid-cols-1 gap-1'}`}
                    >
                      <div className="absolute bg-blue-600/30 rounded-lg transition-all duration-300 ease-out pointer-events-none" style={highlightStyle}></div>
                      
                      <NavLink to={item.href} onMouseEnter={(e) => handleMouseEnter(e, item.name.toLowerCase())} className="relative z-10 p-3 font-semibold text-white rounded-lg">
                        Resumen de {item.name}
                      </NavLink>

                      {submenuData[item.name.toLowerCase()].map((subItem) => (
                        <Link key={subItem.name} to={subItem.href} onMouseEnter={(e) => handleMouseEnter(e, item.name.toLowerCase())} className="relative z-10 flex items-start gap-4 p-3 rounded-lg">
                          <div className="text-blue-400 mt-1 flex-shrink-0"><subItem.icon /></div>
                          <div>
                            <p className="font-semibold text-white">{subItem.name}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <NavLink to="/contacto" className={getNavLinkClass('/contacto')}>
              Contacto
            </NavLink>
          </div>

          <div className="hidden md:block"><Link to="/login" className="px-5 py-2 bg-e360-accent text-white font-semibold rounded-full hover:bg-e360-dark transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">Login</Link></div>
          <div className="md:hidden flex items-center"><button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-md text-gray-400 hover:text-white"><svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7" /></svg></button></div>
        </div>
      </nav>
      
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-white" onClick={() => setMobileMenuOpen(false)}></div>
          <div className={`relative h-full w-4/5 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}><Imagen className="h-12 w-auto" src={logo} alt="Logo E360" /></Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md text-e360-text-dark hover:text-e360-accent"><svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          <div className="py-6 px-4 space-y-2">
            {mainMenuItems.map((item, index) => (
              <div key={item.name} className={`transition-all duration-500 ease-out ${mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}`} style={{ transitionDelay: `${index * 50}ms` }}>
                <div className="flex justify-between items-center">
                  <NavLink to={item.href} className="block flex-grow px-3 py-2 rounded-md text-xl font-semibold text-e360-text-dark hover:bg-gray-100 hover:text-e360-accent" onClick={() => setMobileMenuOpen(false)}>{item.name}</NavLink>
                  {submenuData[item.name.toLowerCase()] && (
                    <button onClick={() => setOpenMobileSubmenu(openMobileSubmenu === item.name ? '' : item.name)} className="p-2 text-e360-text-dark">
                      <svg className={`h-5 w-5 transform transition-transform ${openMobileSubmenu === item.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                  )}
                </div>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openMobileSubmenu === item.name ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="pl-4 mt-1 pt-1 border-l-2 border-gray-300 space-y-1">
                    {submenuData[item.name.toLowerCase()]?.map((subItem) => (
                      <Link key={subItem.name} to={subItem.href} className="block px-3 py-2 rounded-md text-lg text-e360-text-dark hover:text-e360-accent hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>{subItem.name}</Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {/* Standalone Contact Link for Mobile */}
            <div className={`transition-all duration-500 ease-out ${mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}`} style={{ transitionDelay: `${mainMenuItems.length * 50}ms` }}>
              <NavLink 
                to="/contacto" 
                className="block px-3 py-2 rounded-md text-xl font-semibold text-e360-text-dark hover:bg-gray-100 hover:text-e360-accent" 
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
              </NavLink>
            </div>

            <div className={`pt-6 transition-all duration-500 ease-out ${mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}`} style={{ transitionDelay: `${(mainMenuItems.length + 1) * 50}ms` }}>
              <Link to="/login" className="block w-full text-center px-4 py-3 bg-e360-accent text-white font-semibold rounded-full hover:bg-e360-dark">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}