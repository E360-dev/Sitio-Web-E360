import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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

export default function CallToAction() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

  const benefits = [
    "Rigor técnico que respalda cada decisión",
    "Velocidad real en cada entrega",
    "Cercanía que entiende tu negocio"
  ];

  return (
    <section id="cercania-humana" className="bg-white overflow-hidden py-12 sm:py-16">
      <div ref={ref} className="transition-all duration-1000 ease-out">
        
        {/* PARTE SUPERIOR: Título sobre fondo blanco */}
        <div className={`max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#2e527f] leading-tight">
            ADN Big Four, Cercanía Humana.
          </h2>
        </div>

        {/* PARTE CENTRAL: Franja Azul delgada con contenido */}
        <div className={`bg-[#2e527f] py-8 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Texto y Pills - Ocupa 8/12 del espacio para que quepan en una línea */}
              <div className="flex flex-col space-y-8 lg:col-span-8">
                <p className="text-lg leading-8 text-white/90 max-w-2xl">
                  En E360 convertimos la complejidad financiera en decisiones claras. Integramos experiencia técnica de alto nivel, agilidad en la ejecución y cercanía real para que avances con certeza, acceso a financiamiento y resultados medibles.
                </p>

                <div className="flex flex-wrap lg:flex-nowrap gap-2">
                  {benefits.map((benefit, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-white text-[#2e527f] rounded-full text-[12px] font-bold shadow-sm whitespace-nowrap hover:bg-gray-100 transition-colors"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Imagen - Ocupa 4/12 del espacio */}
              <div className="flex flex-col items-center lg:col-span-4 relative">
                <img 
                  src="/img/adnbigfour.jpg" 
                  alt="ADN Big Four" 
                  className="w-full max-w-sm h-auto max-h-[320px] object-cover shadow-2xl"
                />
                <img 
                  src="/img/logo.png" 
                  alt="Logo E360" 
                  className="mt-4 w-16 h-auto self-end opacity-90"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PARTE INFERIOR: Botón sobre fondo blanco */}
        <div className={`max-w-7xl mx-auto px-6 lg:px-8 mt-12 flex justify-center transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Link
            to="/servicios"
            className="px-8 py-3 bg-[#E91E63] text-white font-bold text-lg rounded-full hover:bg-[#D81B60] transition-all duration-300 shadow-xl hover:shadow-[#E91E63]/30 transform hover:scale-105"
          >
            Explora como podemos ayudarte
          </Link>
        </div>

      </div>
    </section>
  );
}
