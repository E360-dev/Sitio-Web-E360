// src/components/KeyDifferentiators.jsx
export default function KeyDifferentiators() {
  const cards = [
    {
      img: '/img/consultores.jpg',
      title: 'Consultores Senior',
      text: 'Amplia experiencia en dirección financiera y estratégica.',
      href: '/nosotros#equipo',
      cta: 'Saber más →'
    },
    {
      img: '/img/personalizacion.jpg',
      title: 'Soluciones Personalizadas',
      text: 'Cada cliente es único. Nuestro enfoque también.',
      href: '/servicios',
      cta: 'Conocer más →'
    },
    {
      img: '/img/tecnologia.jpg',
      title: 'Tecnología Avanzada',
      text: 'Aplicamos IA y automatización en nuestras soluciones financieras.',
      href: '/servicios/tecnologia-automatizacion',
      cta: 'Ver tecnología →'
    }
  ]

  return (
    <section className="py-16 bg-white text-gray-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`relative h-80 overflow-hidden rounded-xl shadow-lg ${
              i === 2 ? 'md:col-span-2' : ''
            }`}
          >
            <img
              src={card.img}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-6">
              <h3 className="text-white text-2xl font-bold mb-2">{card.title}</h3>
              <p className="text-white text-sm">{card.text}</p>
              <a
                href={card.href}
                className="mt-4 inline-block px-5 py-2 bg-white text-[#2e527f] text-sm font-semibold rounded-full hover:bg-gray-100 transition"
              >
                {card.cta}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
