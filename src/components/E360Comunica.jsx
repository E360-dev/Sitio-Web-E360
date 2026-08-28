import React, { useRef } from 'react';
import Imagen from './Imagen';

const comunicaItems = [
  { imageUrl: '/img/Comunica1.jpg', alt: 'La Auditoría', cta: 'La Auditoría' },
  { imageUrl: '/img/Comunica2.jpg', alt: 'Mercado Inmobiliario', cta: 'Mercado Inmobiliario' },
  { imageUrl: '/img/Comunica3.jpg', alt: 'CFO y los cierres', cta: 'CFO y los cierres' },
];

export default function E360Comunica() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
      const cardWidth = scrollRef.current.firstChild.clientWidth + 32; // card + gap
      
      let scrollTo;
      if (direction === 'left') {
        // Si estamos al principio, vamos al final
        if (scrollLeft <= 0) {
          scrollTo = scrollWidth;
        } else {
          scrollTo = scrollLeft - cardWidth;
        }
      } else {
        // Si estamos al final, volvemos al principio (Loop infinito)
        if (scrollLeft + clientWidth >= scrollWidth - 10) { // -10 por margen de error de redondeo
          scrollTo = 0;
        } else {
          scrollTo = scrollLeft + cardWidth;
        }
      }
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section id="e360-comunica" className="bg-white py-20 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Título con líneas decorativas */}
        <div className="flex items-center justify-center gap-6 mb-16">
          <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent via-e360-cyan to-e360-highlight"></div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-800 whitespace-nowrap">
            E360 Comunica
          </h2>
          <div className="hidden sm:block h-px flex-1 bg-gradient-to-l from-transparent via-e360-cyan to-e360-highlight"></div>
        </div>

        {/* Carrusel */}
        <div className="relative group px-4">
          {/* Contenedor de Scroll */}
          <div 
            ref={scrollRef}
            className="flex gap-8 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {comunicaItems.map((item, index) => (
              <div 
                key={index} 
                className="flex-none w-[85%] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] snap-center sm:snap-start"
              >
                <div className="relative flex flex-col items-center">
                  {/* Contenedor de Imagen (con overflow-hidden para la imagen) */}
                  <div className="relative w-full aspect-square">
                    <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                      <Imagen
                        className="w-full h-full object-cover"
                        src={item.imageUrl}
                        alt={item.alt}
                      />
                    </div>
                    
                    {/* Badge con texto dinámico (FUERA del overflow-hidden para que no se corte) */}
                    <div className="absolute bottom-0 right-0 translate-x-2 sm:translate-x-4 translate-y-[-10%] z-20">
                      <span className="bg-[#2e527f] text-white text-xs sm:text-xl font-bold px-5 py-3 sm:px-10 sm:py-5 rounded-full whitespace-nowrap shadow-xl">
                        {item.cta}
                      </span>
                    </div>
                  </div>
                  
                  {/* Espacio extra inferior para el badge */}
                  <div className="h-10 w-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Flechas de Navegación */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-[-10px] md:left-[-20px] top-[45%] -translate-y-1/2 z-30 bg-white p-2 md:p-3 rounded-full border border-gray-200 shadow-md text-gray-400 hover:text-[#2e527f] hover:border-[#2e527f] transition-all flex items-center justify-center"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-[-10px] md:right-[-20px] top-[45%] -translate-y-1/2 z-30 bg-white p-2 md:p-3 rounded-full border border-gray-200 shadow-md text-gray-400 hover:text-[#2e527f] hover:border-[#2e527f] transition-all flex items-center justify-center"
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
