import { Link } from 'react-router-dom';

// src/components/ServiceHero.jsx
export default function ServiceHero() {
  return (
    <div className="bg-gradient-to-r from-e360-accent to-e360-dark text-white overflow-hidden pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-base font-semibold leading-7 text-e360-cyan">Soluciones Integrales</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Nuestros Servicios
        </h1>
        <div className="h-1 w-96 mx-auto mt-4 bg-gradient-to-r from-e360-highlight via-e360-cyan to-e360-accent rounded-full"></div>
        <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-white">
          Diseñados para potenciar el crecimiento, la eficiencia y la certidumbre de su negocio en un entorno complejo.
        </p>
        <div className="mt-16 flex justify-center">
          <a
            href="#servicios"
            className="text-white hover:text-e360-cyan transition-colors duration-300 animate-bounce"
            aria-label="Ir a servicios"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
