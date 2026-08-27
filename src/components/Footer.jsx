import React from 'react';
import { Link } from 'react-router-dom';
import logo from '/img/logo1.png';

// --- Iconos de Redes Sociales (SVGs) ---
const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="max-w-7xl mx-auto py-12 px-6 lg:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          
          {/* Columna Izquierda: Logo y Páginas */}
          <div className="space-y-6">
            <img className="h-16 w-auto" src={logo} alt="Logo E360" />
            <nav>
              <ul className="flex flex-col space-y-3">
                <li><Link to="/" className="text-gray-600 hover:text-[#2e527f] font-medium transition-colors">Inicio</Link></li>
                <li><Link to="/servicios" className="text-gray-600 hover:text-[#2e527f] font-medium transition-colors">Servicios</Link></li>
                <li><Link to="/nosotros" className="text-gray-600 hover:text-[#2e527f] font-medium transition-colors">Nosotros</Link></li>
              </ul>
            </nav>
          </div>

          {/* Columna Centro: Copyright y Redes */}
          <div className="text-center space-y-6">
            <p className="text-[#2e527f] font-bold text-lg leading-relaxed">
              Resolvemos lo complejo con claridad.<br />
              <span className="text-[#25c6e3]">ADN Big Four, Cercanía Humana.</span>
            </p>
            <div className="flex justify-center space-x-6">
              <a
                href="https://www.linkedin.com/company/enlace-consultores-financieros-sas/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#2e527f] transition-all transform hover:scale-110"
              >
                <span className="sr-only">LinkedIn</span>
                <LinkedInIcon />
              </a>
            </div>
            <p className="text-gray-400 text-sm italic">&copy; 2026 E360. Boutique Estratégica.</p>
          </div>

          {/* Columna Derecha: CTA Creativo */}
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-[#2e527f] font-extrabold text-2xl leading-tight">
              ¿Listo para dar el<br className="hidden lg:block" /> siguiente paso?
            </h3>
            <p className="text-gray-600 text-sm max-w-xs mx-auto">
              Llevamos tu estrategia financiera al nivel de las Big Four con la agilidad que tu empresa necesita.
            </p>
            <Link 
              to="/contacto" 
              className="inline-block px-10 py-3 bg-[#2e527f] text-white font-bold rounded-full hover:bg-[#1e3a5f] transition-all shadow-lg transform hover:scale-105"
            >
              CONTÁCTANOS
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}
