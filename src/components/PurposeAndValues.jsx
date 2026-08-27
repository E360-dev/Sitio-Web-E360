import React from 'react';

const values = [
  {
    name: 'Claridad',
    description: 'Hacemos entendible lo complejo.\nEntregamos información que permite decidir con certeza, sin ambigüedades ni ruido innecesario.',
    image: '/img/principios1.jpg',
  },
  {
    name: 'Confianza',
    description: 'Cumplimos lo que prometemos.\nActuamos con transparencia y consistencia, entendiendo que la confianza se construye en cada entrega.',
    image: '/img/principios2.jpg',
  },
  {
    name: 'Empatía',
    description: 'Antes de proponer, entendemos.\nEscuchamos el contexto del cliente y alineamos cada solución a su realidad operativa y estratégica.',
    image: '/img/principios3.jpg',
  },
  {
    name: 'Rigor',
    description: 'La técnica no es negociable.\nAplicamos metodologías probadas, control de calidad y participación senior para asegurar resultados sólidos.',
    image: '/img/principios4.jpg',
  },
];

export default function PurposeAndValues() {
  return (
    <section id="purpose-values" className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-20">
          <h2 className="text-base font-semibold uppercase tracking-wider text-[#25c6e3]">EL ADN DE E360</h2>
          <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-[#2e527f]">
            Nuestros Principios
          </p>
          <div className="mt-8 max-w-3xl mx-auto text-lg leading-8 text-gray-600 space-y-4">
            <p>En E360 resolvemos lo complejo con claridad, acompañamos lo técnico con criterio y construimos confianza en cada decisión.</p>
            <p>Creemos que el valor no está en los reportes, sino en la capacidad de transformar información en resultados reales y sostenibles.</p>
          </div>
        </div>

        {/* Grid de Principios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div 
              key={value.name} 
              className="flex flex-col bg-[#2e527f] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-2 h-full"
            >
              {/* Imagen Superior (Contenida) */}
              <div className="w-full aspect-video overflow-hidden">
                <img 
                  src={value.image} 
                  alt={value.name} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>

              {/* Contenido del bloque (Texto debajo) */}
              <div className="flex flex-col flex-grow p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {value.name}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed mb-8 flex-grow whitespace-pre-line">
                  {value.description}
                </p>

                {/* Barra inferior decorativa segmentada */}
                <div className="mt-auto pt-4 flex gap-1 items-center">
                  <div className="h-1 flex-1 bg-white/30 rounded-full"></div>
                  <div className="h-1 flex-1 bg-[#25c6e3] rounded-full"></div>
                  <div className="h-1 flex-1 bg-[#E91E63] rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
