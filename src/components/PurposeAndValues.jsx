import React from 'react';
import { FaLightbulb, FaHandshake, FaHeart, FaSearch } from 'react-icons/fa';

const values = [
  {
    name: 'Claridad',
    description: 'Traducimos lo complejo. Entregamos información que permite decidir sin margen de duda.',
    Icon: FaLightbulb,
  },
  {
    name: 'Confianza',
    description: 'Actuamos con transparencia y cumplimiento, entendiendo que la confianza es un activo financiero.',
    Icon: FaHandshake,
  },
  {
    name: 'Empatía',
    description: 'Escuchamos, entendemos y nos alineamos al contexto real del cliente antes de actuar.',
    Icon: FaHeart,
  },
  {
    name: 'Rigor',
    description: 'Aplicamos metodologías probadas, control de calidad técnico y revisión senior en cada entrega.',
    Icon: FaSearch,
  },
];

export default function PurposeAndValues() {
  return (
    <section id="purpose-values" className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-e360-cyan">El ADN de E360</h2>
          <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Nuestros Principios
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-gray-700">
            Resolver lo complejo con claridad, acompañar lo técnico con criterio y mantener la confianza como principio operativo. Creemos que la inteligencia financiera no se mide en reportes, sino en la capacidad de transformar decisiones en resultados tangibles.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div 
              key={value.name} 
              className="group relative p-8 text-center bg-gray-50 border border-gray-200 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="relative z-10 flex flex-col items-center">
                <div className="inline-block text-[#365e91] transition-transform duration-300 group-hover:scale-110 mb-4">
                  <value.Icon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{value.name}</h3>
                <p className="mt-2 text-gray-600 text-sm">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
