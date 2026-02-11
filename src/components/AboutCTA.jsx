import { Link } from 'react-router-dom';

export default function AboutCTA() {
  return (
    <section className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          ¿Listo para Trabajar con Nosotros?
        </h2>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10">
          Descubre cómo nuestro equipo puede ayudarte a alcanzar tus metas. Contáctanos para una consulta inicial y demos el siguiente paso juntos.
        </p>
        <Link
              to="/contacto"
              className="inline-block bg-gradient-to-r from-[#365e91] to-[#4a7ab8] text-white font-bold text-lg py-4 px-12 rounded-full hover:opacity-90 transition-opacity duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Hablemos
            </Link>      </div>
    </section>
  );
}
