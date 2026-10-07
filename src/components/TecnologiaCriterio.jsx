import { Link } from 'react-router-dom';

export default function TecnologiaCriterio() {
  return (
    <section id="tecnologia" className="bg-white pb-16 sm:pb-24">
      <div className="bg-[#2e527f] py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Tecnología con criterio profesional
          </h2>
          <div className="mt-8 text-lg leading-8 text-white/90 space-y-4">
            <p>Integramos tecnología e inteligencia artificial para elevar la calidad de nuestro trabajo y ayudarte a identificar y reducir riesgos en tu negocio.</p>
            <p>Nuestros profesionales orientan su uso, revisan el trabajo y mantienen la responsabilidad sobre los criterios y conclusiones. Así incorporamos nuevas capacidades con atención a lo que importa para tu empresa.</p>
          </div>
          <Link
            to="/nosotros#equipo"
            className="inline-block mt-10 px-8 py-3 bg-[#E91E63] text-white font-bold text-lg rounded-full hover:bg-[#D81B60] transition-all duration-300 shadow-xl hover:shadow-[#E91E63]/30 transform hover:scale-105"
          >
            Conoce nuestro equipo y método
          </Link>
        </div>
      </div>
    </section>
  );
}
