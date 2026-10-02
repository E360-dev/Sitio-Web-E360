import React, { useEffect, useRef, useState } from 'react';
import { fondoWebp } from './Imagen';

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

const differentiators = [
  {
    title: 'Consultores Senior',
    text: 'Tienes acceso cercano a socios y especialistas en distintas disciplinas, con trayectoria en firmas Big Four.\nTrabajan contigo para entender el problema, conectar sus implicaciones y ofrecerte una respuesta bien sustentada.',
  },
  {
    title: 'Soluciones a la Medida',
    text: 'Diseñamos el trabajo alrededor de tu negocio, tus prioridades y la decisión que necesitas tomar.\nDesde una auditoría hasta un cierre o una transacción compleja, combinamos profundidad técnica y sentido práctico para ofrecer soluciones que puedas llevar a tu operación.',
  },
  {
    title: 'Inteligencia Financiera',
    text: 'Dale sentido a los números de tu negocio.\nConectamos resultados, flujo de caja y variaciones para entender qué está pasando, dónde están los riesgos y qué decisiones requieren atención.',
  }
];

export default function KeyDifferentiators() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

  return (
    <section id="nuestra-ventaja" className="bg-white overflow-hidden">
      
      {/* 1. Encabezado Superior (Fondo Blanco) */}
      <div className="pt-8 pb-16 sm:pt-12 sm:pb-24 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-[#25c6e3]">
          Inteligencia que marca la diferencia
        </h2>
        
        {/* Línea decorativa segmentada */}
        <div className="h-1 w-full max-w-[36rem] mx-auto mt-4 flex rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-black"></div>
          <div className="h-full w-1/3 bg-[#25c6e3]"></div>
          <div className="h-full w-1/3 bg-[#E91E63]"></div>
        </div>
        
        <div className="mt-8 text-lg leading-8 text-gray-700 max-w-4xl mx-auto space-y-4">
          <p>La especialización hace la diferencia cuando una decisión es compleja. Reunimos experiencia técnica, visión de negocio y la agilidad de una boutique para trabajar contigo en los asuntos que más importan.</p>
          <p>Integramos tecnología e inteligencia artificial con criterio profesional, metodologías estructuradas y revisión técnica. El propósito es claro: elevar la calidad del trabajo y ayudarte a identificar y reducir riesgos.</p>
        </div>
      </div>

      {/* 2. Sección con Imagen de Fondo y Overlay */}
      <div 
        ref={ref}
        className="relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: fondoWebp('/img/keydifferentiators.jpg') }}
      >
        {/* Overlay oscuro (azul/negro azulado ~70%) */}
        <div className="absolute inset-0 bg-[#0a1e3c]/70"></div>

        {/* Contenido en 3 columnas sobre el fondo */}
        <div className={`relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-32 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 lg:gap-16">
            {differentiators.map((item, index) => (
              <div key={index} className="flex flex-col items-center md:items-start text-center md:text-left">
                <h3 className="text-2xl font-bold text-[#25c6e3] mb-4">
                  {item.title}
                </h3>
                <p className="text-white/90 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
