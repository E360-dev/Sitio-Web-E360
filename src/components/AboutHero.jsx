import { Link } from 'react-router-dom';

export default function AboutHero() {
  return (
    <div className="bg-gradient-to-r from-e360-accent to-e360-dark text-white overflow-hidden pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-base font-semibold leading-7 text-e360-cyan">
          NUESTRA FILOSOFÍA
        </h2>
<p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Impacto real, con técnica y criterio
        </p>
        <div className="h-1 w-96 mx-auto mt-4 bg-gradient-to-r from-e360-highlight via-e360-cyan to-e360-accent rounded-full"></div>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-white">
          En E360 combinamos la experiencia técnica de firmas internacionales con la agilidad de una boutique estratégica. Nuestro enfoque no es vender horas, sino resolver lo complejo con precisión, velocidad y criterio.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/nosotros#proposito"
            className="px-8 py-3 bg-gradient-to-r from-[#365e91] to-[#4a7ab8] text-white font-semibold rounded-full hover:opacity-90 transition-opacity duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Nuestro Propósito
          </Link>
          <Link
            to="/nosotros#equipo"
            className="px-8 py-3 border border-white/50 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Conoce al Equipo
          </Link>
        </div>
      </div>
    </div>
  );
}
