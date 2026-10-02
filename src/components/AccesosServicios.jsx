import { Link } from 'react-router-dom';
import { SERVICIOS_PRINCIPALES } from '../datos/servicios';

// Texto de cada acceso; los ids y nombres salen de datos/servicios.js para que
// el enlace coincida siempre con la pestaña de /servicios.
const textos = {
  auditoria: 'Confianza en tu información financiera, con independencia, rigor y conocimiento del negocio.',
  consultoria: 'Especialización para resolver asuntos complejos y avanzar con decisiones bien sustentadas.',
  bps: 'Contabilidad y cumplimiento con una lectura del negocio útil para Dirección y Consejo.',
};

export default function AccesosServicios() {
  return (
    <section id="servicios-principales" className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#2e527f]">
            ¿En qué podemos ayudarte?
          </h2>
          <div className="h-1 w-full max-w-[36rem] mx-auto mt-4 flex rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-black"></div>
            <div className="h-full w-1/3 bg-[#25c6e3]"></div>
            <div className="h-full w-1/3 bg-[#E91E63]"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICIOS_PRINCIPALES.map((servicio) => (
            <Link
              key={servicio.id}
              to={`/servicios#${servicio.id}`}
              className="group flex flex-col bg-[#2e527f] rounded-2xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#25c6e3]"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{servicio.nombre}</h3>
              <p className="text-white/80 leading-relaxed mb-8 flex-grow">{textos[servicio.id]}</p>
              <span className="font-semibold text-[#25c6e3] group-hover:text-white transition-colors">
                Conoce el servicio →
              </span>
              <div className="mt-6 flex gap-1 items-center">
                <div className="h-1 flex-1 bg-white/30 rounded-full"></div>
                <div className="h-1 flex-1 bg-[#25c6e3] rounded-full"></div>
                <div className="h-1 flex-1 bg-[#E91E63] rounded-full"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
