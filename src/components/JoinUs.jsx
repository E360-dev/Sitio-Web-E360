import React from 'react';

export default function JoinUs() {
  return (
    <section id="join-us" className="bg-gray-800 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-extrabold sm:text-5xl text-white">
          Forma Parte de la Próxima Generación de Expertos
        </h2>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-300">
          En E360, no solo te unes a una empresa, te integras a un ecosistema de aprendizaje continuo. Buscamos talento curioso y proactivo con pasión por la auditoría y la tecnología. Aquí, tu carrera despega mientras te formas con líderes de la industria y aplicas tu conocimiento en desafíos reales que marcan la diferencia.
        </p>
        <div className="mt-10">
          <a
            href="/contacto" // Idealmente, a una página de carreras o un formulario específico
            className="inline-block bg-white text-gray-900 font-bold py-4 px-12 rounded-full hover:bg-gray-200 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            Ver Oportunidades
          </a>
        </div>
      </div>
    </section>
  );
}
