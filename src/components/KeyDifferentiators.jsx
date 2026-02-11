
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

// --- Iconos Personalizados para los Diferenciadores ---

const ConsultoresIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SolucionesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.62-3.385m-5.043-.025a15.998 15.998 0 01-3.388-1.621m-5.043.025a15.998 15.998 0 00-3.388-1.621m16.5 5.043a15.998 15.998 0 00-1.62-3.385m-5.043-.025a15.998 15.998 0 01-1.622-3.385" />
  </svg>
);

const TecnologiaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5l.415-.207a.75.75 0 011.085.67V10.5m0 0h6m-6 0a.75.75 0 001.085.67l.415-.207M3 16.5V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
  </svg>
);

// --- Datos de los Diferenciadores ---

const differentiators = [
  {
    Icon: ConsultoresIcon,
    title: 'Consultores Senior',
    text: 'Acceso directo a un equipo con trayectoria Big Four y más de una década en dirección financiera, auditoría y transformación corporativa. Nuestros especialistas participan desde el primer día, asegurando decisiones ágiles, precisas y con impacto real. Confianza técnica con rostro humano. Ese es nuestro estándar.',
    href: '/nosotros#equipo',
  },
  {
    Icon: SolucionesIcon,
    title: 'Soluciones a la Medida',
    text: 'No creemos en manuales genéricos. Cada organización tiene su propia historia, urgencia y estructura. Diseñamos estrategias hechas a la medida: desde cierres financieros y fondeos institucionales hasta auditorías express y reporting trimestral. Resolvemos lo complejo sin perder la claridad.',
    href: '/servicios',
  },
  {
    Icon: TecnologiaIcon,
    title: 'Inteligencia Financiera',
    text: 'Integramos inteligencia artificial, automatización y modelado financiero avanzado para convertir los datos en decisiones medibles y anticipar riesgos antes de que aparezcan. Nuestra tecnología multiplica la eficiencia sin sacrificar rigor, generando una ventaja competitiva tangible. IA con propósito: precisión, velocidad y resultados que se sostienen.',
    href: '/servicios/tecnologia-automatizacion',
  }
];

// --- Componente Principal ---

// This comment is added to force Vite to re-process this file.
export default function KeyDifferentiators() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  return (
    <section className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-e360-cyan">Nuestra Ventaja</h2>
          <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-e360-accent">
            Inteligencia que marca la diferencia
          </p>
          <div className="h-1 w-[36rem] mx-auto mt-4 bg-gradient-to-r from-e360-highlight via-e360-cyan to-e360-accent rounded-full"></div>
          <p className="mt-6 text-lg leading-8 text-gray-700">
            E360 no compite por volumen, compite por complejidad. Creamos una categoría propia entre las Big Four y las firmas tradicionales: una boutique estratégica donde la precisión técnica, la velocidad operativa y la cercanía humana convergen para resolver lo complejo con claridad. Transformamos cada auditoría, revisión o estrategia en una experiencia de alto valor, diseñada para fortalecer la continuidad, el fondeo y la confianza de nuestros clientes.
          </p>
        </div>

        <div
          ref={ref}
          className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {differentiators.map((item, index) => (
            <Link 
              to={item.href} 
              key={index} 
              className="group relative block p-8 text-center bg-gradient-to-r from-e360-accent to-e360-dark rounded-3xl shadow-rb-md transition-all duration-300 hover:bg-e360-light hover:shadow-rb-lg hover:-translate-y-2"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute top-0 left-0 w-full h-full rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                   style={{background: 'radial-gradient(circle at center, rgba(54, 94, 145, 0.2), transparent 60%)'}}>
              </div>
              
              <div className="relative z-10">
                <div className="inline-block text-white transition-transform duration-300 group-hover:scale-110">
                  <item.Icon />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-white">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
