// src/components/ServicesCTA.jsx
export default function ServicesCTA() {
  return (
    <div className="bg-[#2e527f] text-white py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">¿Listo para Empezar?</h2>
        <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8">
          Agende una llamada de diagnóstico gratuita con nuestros expertos y
          descubra cómo podemos ayudarle a alcanzar sus objetivos.
        </p>
        <a
          href="/contacto"
          className="inline-block bg-white text-[#2e527f] font-bold text-lg py-3 px-8 rounded-full hover:bg-gray-200 transition-colors duration-300"
        >
          Agendar Llamada
        </a>
      </div>
    </div>
  );
}
