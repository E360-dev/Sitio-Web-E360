import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Hook para detectar cuando el componente está en pantalla
const useOnScreen = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, options);
    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [ref, options]);
  return [ref, isVisible];
};

// --- Iconos Personalizados para los Servicios ---

const ConsultoriaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const FinanciamientoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18.75h16.5M12 6.75v11.25M6.75 6.75h10.5M6.75 18.75h10.5M4.5 12h15" />
  </svg>
);

const TecnologiaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 15.75l4.02-4.02a.75.75 0 011.06 0l4.02 4.02M5.25 8.25l4.02 4.02a.75.75 0 001.06 0l4.02-4.02" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25v7.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 15.75v-7.5a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 8.25z" />
  </svg>
);

// --- Datos de los Servicios ---

const services = [
  {
    Icon: ConsultoriaIcon,
    title: 'Consultoría Financiera e Impuestos',
    description: 'Optimización de cierres complejos, consolidación, valuaciones y planeación fiscal con impacto real en liquidez y rentabilidad.',
    href: '/servicios/consultoria',
    leader: 'Fernando Vázquez',
  },
  {
    Icon: FinanciamientoIcon,
    title: 'Financiamiento y Estructuración',
    description: 'Preparación integral para fondeo y capital con modelos financieros robustos, expedientes bancarios y acompañamiento en negociaciones.',
    href: '/servicios/financiamiento',
    leader: 'Arturo Barrios',
  },
];

// --- Componente Principal ---

export default function ServiceGrid() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  return (
    <section className="bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-white overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-400">Nuestros Servicios</h2>
          <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Soluciones Integrales para tu Negocio
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Desde la certeza regulatoria hasta la inteligencia artificial, te damos la ventaja competitiva que necesitas.
          </p>
        </div>

        <div
          ref={ref}
          className={`mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {services.map((item, index) => (
            <Link 
              to={item.href} 
              key={index} 
              className="group relative block p-8 text-center bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-3xl transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-800/50 hover:-translate-y-2"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute top-0 left-0 w-full h-full rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                   style={{background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.2), transparent 60%)'}}>
              </div>
              
              <div className="relative z-10">
                <div className="inline-block text-blue-400 transition-transform duration-300 group-hover:scale-110">
                  <item.Icon />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-gray-400">{item.description}</p>
                <p className="mt-2 text-blue-400 font-semibold">Líder: {item.leader}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}