// src/components/ImpactCarousel.jsx
import { useState, useEffect } from 'react'

const slides = [
  {
    img: '/img/impacto-1.jpg',
    alt: 'Impacto 1',
    overlay: {
      title: '$8,000 Millones Auditados',
      text: 'en diversas industrias de alto impacto.'
    }
  },
  {
    img: '/img/impacto-2.jpg',
    alt: 'Impacto 2',
    overlay: {
      title: '+80 Clientes Atendidos',
      text: 'En México y Latinoamérica.'
    }
  },
  {
    img: '/img/impacto-3.jpg',
    alt: 'Impacto 3',
    overlay: {
      title: '+18% Mejora en EBITDA',
      text: 'Tras implementación de estrategias E360.'
    }
  }
]

export default function ImpactCarousel() {
  const [slideList, setSlideList] = useState(slides)

  const rotate = (dir = 1) => {
    let newList = [...slideList]
    if (dir === 1) {
      const first = newList.shift()
      newList.push(first)
    } else {
      const last = newList.pop()
      newList.unshift(last)
    }
    setSlideList(newList)
  }

  useEffect(() => {
    rotate(0)
  }, [])

  return (
    <section id="impacto" className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-8 text-[#2e527f]">Nuestro Impacto</h2>

        <div className="relative flex items-center justify-center">
          {/* Botones */}
          <button
            onClick={() => rotate(-1)}
            className="absolute left-0 z-10 bg-white text-black p-2 rounded-full shadow hover:bg-[#2e527f] transition"
          >
            ‹
          </button>
          <button
            onClick={() => rotate(1)}
            className="absolute right-0 z-10 bg-white text-black p-2 rounded-full shadow hover:bg-[#2e527f] transition"
          >
            ›
          </button>

          {/* Carrusel */}
          <div className="flex w-full max-w-5xl overflow-hidden">
            <div className="flex w-full items-center justify-center gap-4">
              {slideList.map((slide, i) => {
                const isCenter = i === 1
                return (
                  <div
                    key={i}
                    className={`impacto-slide w-1/3 transition-all duration-500 relative ${
                      isCenter
                        ? 'scale-100 opacity-100 blur-none z-20'
                        : 'scale-90 opacity-50 blur-sm z-10'
                    }`}
                  >
                    <img
                      src={slide.img}
                      alt={slide.alt}
                      className="w-full h-[400px] object-cover rounded-xl"
                    />
                    {slide.overlay && isCenter && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 rounded-xl text-center">
                        <h3 className="text-xl font-bold bg-black/50 px-4 py-2 rounded">
                          {slide.overlay.title}
                        </h3>
                        <p className="text-sm bg-black/40 mt-2 px-3 py-1 rounded">
                          {slide.overlay.text}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
