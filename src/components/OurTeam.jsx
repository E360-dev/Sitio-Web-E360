import React, { useState } from 'react';

const teamMembers = [
  {
    name: 'C.P.C. Belén Arias',
    role: 'Socia de Auditoría Técnica',
    imageUrl: '/img/Belen.png',
    bio: '17 años de experiencia en auditoría para los sectores construcción, manufactura, retail y financiero. Especialista en IFRS y NIF. Referente en control interno y aseguramiento técnico.',
  },
  {
    name: 'L.C. Arturo Barrios, MBA, MFB',
    role: 'Socio Director de Estrategia y Relación',
    imageUrl: '/img/Arturo Barrios.PNG',
    bio: '20 años de experiencia en auditoría, finanzas y asesoría a entidades emisoras y reguladas. MBA por EGADE Business School y Máster en Finanzas y Banca por la Universitat Pompeu Fabra (España). Candidato a PhD por Charisma University (EE.UU.) y Executive Global System. Enfocado en integrar estrategia financiera, fondeo y liderazgo organizacional.',
  },
  {
    name: 'C.P. Fernando Vázquez, MBA',
    role: 'Socio Director Técnico y Cumplimiento',
    imageUrl: '/img/Fernando Vázquez.PNG',
    bio: '17 años de experiencia en auditoría y asesoría financiera para sectores regulados. MBA por la UNAM y candidato a PhD por Executive Global System (EE.UU.). Especialista en estructuración, control normativo y soporte técnico de alto nivel.',
  },
  // {
  //   name: 'C.P.C. Salvador Castillo',
  //   role: 'Socio de Control de Calidad y Normatividad',
  //   imageUrl: '/img/logo.png',
  //   bio: '38 años de experiencia profesional. Experto en NIF, IFRS y USGAAP. Responsable del aseguramiento técnico y la integridad normativa de los entregables.',
  // },
  // {
  //   name: 'C.P.C. Héctor Novoa y Cota',
  //   role: 'Socio de Práctica Profesional',
  //   imageUrl: '/img/logo.png',
  //   bio: '25 años de experiencia en instrumentos financieros. Referente en aplicación normativa y control contable especializado.',
  // },
  // {
  //   name: 'Jessica Fernández-Dávila',
  //   role: 'Socia de Impuestos',
  //   imageUrl: '/img/logo.png',
  //   bio: '15 años de experiencia en materia fiscal. Experta en planeación tributaria y gestión de cumplimiento con enfoque estratégico.',
  // },
  {
    name: 'Carlos Viveros',
    role: 'Director de Riesgos',
    imageUrl: '/img/logo.png',
    bio: 'Actuario con 17 años de experiencia en gestión de riesgos financieros y modelación de instrumentos. Enfocado en fortalecer la estabilidad y sostenibilidad financiera de cada cliente.',
  },
  // {
  //   name: 'Roberto Barke',
  //   role: 'Socio de Tecnología y Procesos',
  //   imageUrl: '/img/logo.png',
  //   bio: '30 años de experiencia en evaluación, implementación y aseguramiento de sistemas informáticos. Integra tecnología, automatización y control operativo para respaldar la integridad de los procesos.',
  // },
];

export default function OurTeam() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesInView = 3; // Number of slides visible at once

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      (prevIndex + 1) % (teamMembers.length - slidesInView + 1)
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      (prevIndex - 1 + (teamMembers.length - slidesInView + 1)) % (teamMembers.length - slidesInView + 1)
    );
  };

  return (
    <section id="equipo" className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-e360-cyan">NUESTROS LÍDERES</h2>
          <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            El talento que hace posible la transformación
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-gray-700">
            Conoce a los expertos que guían a nuestros clientes hacia el éxito financiero y operativo.
          </p>
        </div>

        <div className="relative mt-20">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * (100 / slidesInView)}%)` }}
            >
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="flex-none w-full md:w-1/2 lg:w-1/3 p-4"
                >
                  <div
                    className="group relative flex flex-col text-center bg-gray-50 border border-gray-200 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 h-full"
                  >
                    <div className="relative z-10 flex flex-col flex-grow p-8">
                      <div className="relative h-40 w-40 mx-auto rounded-full overflow-hidden border-4 border-gray-300 group-hover:border-[#365e91] transition-all duration-300">
                        <img
                          className="absolute inset-0 w-full h-full object-cover"
                          src={member.imageUrl}
                          alt={`Foto de ${member.name}`}
                        />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-gray-900">{member.name}</h3>
                      <p className="mt-1 text-base font-semibold text-[#365e91]">{member.role}</p>
                      <p className="mt-4 text-gray-600 flex-grow text-sm">{member.bio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/80 hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg border border-gray-200 focus:outline-none transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/80 hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg border border-gray-200 focus:outline-none transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
