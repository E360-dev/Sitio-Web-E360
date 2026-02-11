import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// El hook useOnScreen se mantiene igual
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

// Iconos para los beneficios (SVGs de Heroicons)
const PrecisionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-e360-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const VelocidadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-e360-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const EnfoqueHumanoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-e360-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function CallToAction() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.3 });
  return (
    // 1. Fondo oscuro con una textura radial sutil
    <section id="cercania-humana" className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* 2. La Tarjeta Flotante */}
        <div
          className={`transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="relative isolate bg-white/40 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-rb-md transition-all duration-300 hover:scale-[1.02] hover:shadow-rb-lg">
            <div className="px-6 py-16 sm:px-16 sm:py-20 lg:flex lg:items-center lg:gap-x-20">
              <div className="lg:flex-auto">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  ADN Big Four, <span className="text-e360-cyan">Cercanía Humana.</span>
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-700">
                  En E360 resolvemos lo complejo con claridad. Combinamos excelencia técnica, velocidad de respuesta y un enfoque humano para que tus decisiones financieras y estratégicas se conviertan en resultados sostenibles.
                </p>
                {/* 3. Iconografía para Beneficios */}
                <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 text-base leading-7 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex gap-x-4">
                    <dt className="flex-none"><PrecisionIcon /></dt>
                    <dd className="text-gray-700">Precisión técnica y estratégica</dd>
                  </div>
                  <div className="flex gap-x-4">
                    <dt className="flex-none"><VelocidadIcon /></dt>
                    <dd className="text-gray-700">Velocidad y agilidad en cada proceso</dd>
                  </div>
                  <div className="flex gap-x-4">
                    <dt className="flex-none"><EnfoqueHumanoIcon /></dt>
                    <dd className="text-gray-700">Un enfoque humano que marca la diferencia</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-16 lg:mt-0 lg:flex-shrink-0">
                <Link
                  to="/servicios"
                  className="inline-block px-10 py-4 bg-gradient-to-r from-e360-accent to-e360-dark text-white font-bold text-lg rounded-full hover:bg-e360-dark transition-all duration-300 shadow-lg hover:shadow-e360-highlight/40 transform hover:scale-105"
                >
                  Conoce Nuestros Servicios
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
