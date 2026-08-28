import React, { useState } from 'react';
import Imagen from './Imagen';

const teamMembers = [
  {
    name: 'L.C. Arturo Barrios, MBA, MFB',
    role: 'Socio de Estrategia y Relación',
    imageUrl: '/img/equipoarturo.jpg',
    bio: '20 años de experiencia en auditoría, finanzas y asesoría a entidades emisoras y reguladas. MBA por EGADE Business School y Máster en Finanzas y Banca por la Universitat Pompeu Fabra (España). Candidato a PhD por Charisma University (EE.UU.) y Executive Global System. Enfocado en integrar estrategia financiera, fondeo y liderazgo organizacional.',
  },
  {
    name: 'C.P. Fernando Vázquez, MBA',
    role: 'Socio de Estrategia y Relación',
    imageUrl: '/img/equipofernando.jpg',
    bio: 'Cuenta con 17 años de experiencia en Auditoría y Asesoría financiera para entidades de sector Manufactura, Retail y Financiero. Anteriormente, laboró en Clarum Capital LP (Venture Capital Fund).\nMBA por la UNAM y candidato a PhD por Executive Global System en Estados Unidos.',
  },
  {
    name: 'C.P.C. Belén Arias',
    role: 'Socio de Estrategia y Relación',
    imageUrl: '/img/equipobelen.jpeg',
    bio: 'Cuenta con 17 años de experiencia en servicios de auditoría en industrias como Construcción, Manufactura, Retail y sector financiero. Experta en aspectos técnicos normativos de IFRS y NIF.',
  },
  {
    name: 'C.P.C. Salvador Castillo',
    role: 'Socio de Estrategia y Relación',
    imageUrl: '/img/equiposalvador.jpeg',
    bio: 'Ex-Deloitte, con más de 45 años de experiencia en servicios de auditoría. Imparte cursos de diploma sobre NIIF, NIF y PCGA de EE. UU. Colabora con CCPM en las Comisiones de Normas de Auditoría y Contabilidad. Apoya a CENEVAL en el diseño de exámenes para la certificación de Contador Público.',
  },
];

export default function OurTeam() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  const member = teamMembers[currentIndex];

  return (
    <section id="equipo" className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header de la sección */}
        <div className="text-center mb-20">
          <h2 className="text-base font-semibold uppercase tracking-wider text-[#25c6e3]">NUESTROS LÍDERES</h2>
          <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-[#2e527f]">
            El talento que hace posible la transformación
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-gray-700">
            Conoce a los expertos que guían a nuestros clientes hacia el éxito financiero y operativo con una visión estratégica y humana.
          </p>
        </div>

        {/* Contenedor del Slider / Perfil Destacado */}
        <div className="relative mt-12">
          {/* Bloque Principal del Perfil */}
          <div className="relative bg-transparent overflow-hidden">
            <div className="flex flex-col lg:flex-row min-h-[500px]">
              
              {/* Columna Izquierda: Imagen Grande */}
              <div className="w-full lg:w-1/2 relative h-[400px] lg:h-auto overflow-hidden rounded-3xl shadow-2xl">
                <Imagen
                  className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ease-in-out"
                  src={member.imageUrl}
                  alt={member.name}
                  key={`img-${currentIndex}`}
                />
              </div>

              {/* Columna Derecha: Contenido Detallado */}
              <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative bg-gray-50 lg:bg-transparent">
                <div 
                  className="animate-fade-in transition-all duration-700"
                  key={`content-${currentIndex}`}
                >
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                    {member.name}
                  </h3>
                  <p className="text-lg font-medium text-[#2e527f] mb-10 tracking-wide">
                    {member.role}
                  </p>
                  <p className="text-lg leading-relaxed text-gray-700 max-w-2xl">
                    {member.bio}
                  </p>
                </div>

                {/* Línea decorativa horizontal sutil */}
                <div className="w-24 h-px bg-gray-300 mt-12 mb-8"></div>

                {/* Elemento decorativo inferior (indicadores compactos) */}
                <div className="flex space-x-2 select-none pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] via-[#2e527f] to-[#25c6e3] opacity-80"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25c6e3] via-[#2e527f] to-[#1e3a5f] opacity-60"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2e527f] via-[#1e3a5f] to-[#0a1e3c] opacity-40"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Flechas de Navegación Lateral */}
          <button
            onClick={prevSlide}
            className="absolute left-0 lg:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white/40 hover:bg-white/80 text-gray-600 p-3 rounded-full border border-gray-200 backdrop-blur-sm transition-all duration-300 transform hover:scale-110"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 lg:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white/40 hover:bg-white/80 text-gray-600 p-3 rounded-full border border-gray-200 backdrop-blur-sm transition-all duration-300 transform hover:scale-110"
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
