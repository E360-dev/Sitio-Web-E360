export default function FeaturedContent() {
  return (
    <section id="destacado" className="bg-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold sm:text-5xl text-white">
            Nuestro Conocimiento en Acción
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
            Así es como aplicamos la teoría en proyectos que transforman industrias.
          </p>
        </div>
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden lg:flex">
          <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-[#7fa1c7] uppercase mb-2">Caso de Estudio: Tecnología Financiera</h3>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Automatización de Reportes para un Cliente Global
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Descubre cómo nuestro equipo de tecnología y auditoría colaboró para implementar un sistema de reportes automatizados, reduciendo el tiempo de cierre mensual en un 40% y aumentando la precisión de los datos para la toma de decisiones estratégicas.
            </p>
            <div className="mt-2">
              <a
                href="#"
                className="text-white font-bold py-3 px-8 rounded-full hover:bg-gray-700 transition-all duration-300"
              >
                Leer Caso de Estudio &rarr;
              </a>
            </div>
          </div>
          <div className="lg:w-1/2">
            <img
              className="h-64 w-full object-cover lg:h-full"
              src="https://via.placeholder.com/800x600/2A3B4C/FFFFFF?text=Proyecto+Real" // Reemplazar con imagen real
              alt="Caso de Estudio"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
