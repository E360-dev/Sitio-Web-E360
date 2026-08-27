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

const differentiators = [
  {
    title: 'Consultores Senior',
    text: 'Acceso directo a especialistas con trayectoria Big Four y experiencia en escenarios críticos.\nAquí no hay capas innecesarias: desde el primer día trabajas con quien entiende el problema y lo resuelve.\nDecisiones más rápidas, análisis más preciso y ejecución con responsabilidad real.',
  },
  {
    title: 'Soluciones a la Medida',
    text: 'No aplicamos recetas. Diseñamos soluciones específicas según tu contexto, urgencia y objetivos.\nDesde auditorías y cierres complejos hasta estructuración para fondos, adaptamos cada estrategia para que funcione en la práctica, no solo en papel.',
  },
  {
    title: 'Inteligencia Financiera',
    text: 'Convertimos datos en decisiones.\nIntegramos tecnología, analítica e inteligencia financiera para anticipar riesgos, optimizar procesos y generar claridad en momentos críticos.\nMás información no es la solución. La claridad sí.',
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
        <div className="h-1 w-[36rem] mx-auto mt-4 flex rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-black"></div>
          <div className="h-full w-1/3 bg-[#25c6e3]"></div>
          <div className="h-full w-1/3 bg-[#E91E63]"></div>
        </div>
        
        <div className="mt-8 text-lg leading-8 text-gray-700 max-w-4xl mx-auto space-y-4">
          <p>En E360 no competimos por volumen, competimos por resolver lo complejo.</p>
          <p>Creamos una categoría propia entre las firmas tradicionales y las Big Four: una boutique estratégica donde la precisión técnica, la velocidad de ejecución y la cercanía humana trabajan juntas.</p>
          <p>Transformamos auditorías, revisiones y decisiones financieras en resultados claros, medibles y accionables. Porque no se trata solo de cumplir, sino de avanzar con certeza.</p>
        </div>
      </div>

      {/* 2. Sección con Imagen de Fondo y Overlay */}
      <div 
        ref={ref}
        className="relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/keydifferentiators.jpg')" }}
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
