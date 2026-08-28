import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';

// El mapa es lo último de la home y arrastra leaflet entero. Se carga solo
// cuando el usuario se acerca a esta sección; el contenedor tiene altura fija,
// así que la aparición no desplaza nada.
const MapaLeaflet = lazy(() => import('./MapaLeaflet'));

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

export default function MapaPresencia() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });
  // rootMargin adelanta la descarga del mapa: para cuando la sección entra en
  // pantalla, el chunk ya suele estar listo y no se ve el placeholder.
  const [precargaRef, cercaDeVerse] = useOnScreen({ rootMargin: '400px' });

  return (
    <section id="presencia" className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-base font-semibold leading-7 text-e360-cyan">Cobertura Nacional</h2>
        <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-e360-accent">
          Estamos donde nos necesitas
        </p>
        <div className="h-1 w-[36rem] mx-auto mt-4 bg-gradient-to-r from-e360-highlight via-e360-cyan to-e360-accent rounded-full"></div>
        <p className="mt-6 text-lg leading-8 text-gray-700">
          Nuestras sedes estratégicas nos permiten ofrecerte un servicio cercano y ágil en todo México.
        </p>

        <div
          ref={ref}
          className={`mt-16 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Contenedor con efecto glassmorphism */}
          <div className="relative p-4 sm:p-6 bg-white/40 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-2xl shadow-gray-300/40">
            <div ref={precargaRef} className="w-full h-[500px] rounded-xl overflow-hidden bg-gray-100">
              {cercaDeVerse && (
                <Suspense fallback={<div className="w-full h-full bg-gray-100" />}>
                  <MapaLeaflet />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          .map-dark-blue .leaflet-tile-pane {
            filter: sepia(0.5) hue-rotate(180deg) saturate(2);
          }
        `}
      </style>
    </section>
  );
}
