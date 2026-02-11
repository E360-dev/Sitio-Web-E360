export default function NewsletterCTA() {
  return (
    <section id="suscripcion" className="bg-gray-900 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">
          No te Pierdas Ninguna Oportunidad
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Suscríbete para recibir notificaciones sobre nuevas vacantes, eventos de reclutamiento y contenido exclusivo de nuestra academia.
        </p>
        <form className="max-w-lg mx-auto sm:flex">
          <input
            type="email"
            required
            placeholder="Tu correo electrónico"
            className="w-full px-5 py-3 rounded-md sm:rounded-r-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7fa1c7]"
          />
          <button
            type="submit"
            className="mt-3 sm:mt-0 w-full sm:w-auto bg-[#7fa1c7] text-white font-bold px-8 py-3 rounded-md sm:rounded-l-none hover:bg-opacity-90 transition-all duration-300"
          >
            Mantenerme Informado
          </button>
        </form>
      </div>
    </section>
  );
}
