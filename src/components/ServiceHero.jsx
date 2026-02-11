import { Link } from 'react-router-dom';

// src/components/ServiceHero.jsx
export default function ServiceHero() {
  return (
    <div className="bg-gradient-to-r from-e360-accent to-e360-dark text-white overflow-hidden pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-base font-semibold leading-7 text-e360-cyan">Soluciones Integrales</h2>
        <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Nuestros Servicios
        </p>
        <div className="h-1 w-96 mx-auto mt-4 bg-gradient-to-r from-e360-highlight via-e360-cyan to-e360-accent rounded-full"></div>
        <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-white">
          Diseñados para potenciar el crecimiento, la eficiencia y la certidumbre de su negocio en un entorno complejo.
        </p>
        <div className="mt-10">
          <Link
            to="/servicios#servicios"
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#365e91] to-[#4a7ab8] text-white font-semibold rounded-full hover:opacity-90 transition-opacity duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Ver Servicios
          </Link>
        </div>
      </div>
    </div>
  );
}
