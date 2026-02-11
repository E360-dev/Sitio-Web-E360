import React, { useEffect, useRef, useState } from 'react';

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

// --- Iconos para las Métricas ---

const ActivosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6m-6 4.5h6M3.75 6.75h16.5" />
  </svg>
);

const EbitdaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const ClientesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.25 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.5-5.5M5 21l5.5-5.5M5 21v-4.5c0-1.1.9-2 2-2h10a2 2 0 012 2V21M10.5 3.75a2.25 2.25 0 00-4.5 0" />
  </svg>
);

export default function ImpactMetrics() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  const metrics = [
    {
      Icon: ActivosIcon,
      label: 'Activos Auditados',
      value: '+1 billon de dolares',
      detail: 'en diversas industrias de alto impacto'
    },
    {
      Icon: EbitdaIcon,
      label: 'Mejora en EBITDA',
      value: '+18%',
      detail: 'tras implementación de estrategias E360'
    },
    {
      Icon: ClientesIcon,
      label: 'Clientes Atendidos',
      value: '+80',
      detail: 'en México y Latinoamérica'
    }
  ];

  return (
    <section id="impacto" className="bg-gradient-to-r from-e360-accent to-e360-dark text-white overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-base font-semibold leading-7 text-e360-cyan">Resultados Medibles</h2>
        <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Nuestro Impacto en Números
        </p>
        <div className="h-1 w-[36rem] mx-auto mt-4 bg-gradient-to-r from-e360-highlight via-e360-cyan to-e360-accent rounded-full"></div>
        <p className="mt-6 text-lg leading-8 text-white">
          Transformamos estrategias en resultados tangibles y sostenibles.
        </p>

        <div
          ref={ref}
          className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {metrics.map((metric, i) => (
            <div key={i} className="group relative p-8 text-center bg-black/20 backdrop-blur-sm border border-white/10 rounded-3xl shadow-rb-md transition-all duration-300 hover:shadow-rb-lg hover:bg-black/30 hover:-translate-y-2">
              {/* Efecto de brillo en hover */}
              <div className="absolute top-0 left-0 w-full h-full rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                   style={{background: 'radial-gradient(circle at center, rgba(232, 5, 84, 0.2), transparent 70%)'}}>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="inline-block text-white transition-transform duration-300 group-hover:scale-110">
                  <metric.Icon />
                </div>
                <div className="mt-4 text-5xl font-extrabold text-white">{metric.value}</div>
                <div className="mt-2 text-xl font-bold text-white">{metric.label}</div>
                <p className="mt-1 text-md text-white">{metric.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
