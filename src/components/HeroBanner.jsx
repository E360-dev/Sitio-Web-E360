import { useEffect, useRef, useState } from 'react'

const videos = [
  { src: '/videos/proposito.mp4', cta: 'Conoce nuestros servicios →', link: '#servicios' },
  { src: '/videos/productos.mp4', cta: 'Descubre nuestro enfoque →', link: '#nosotros' },
  { src: '/videos/experiencia.mp4', cta: 'Ver credenciales →', link: '#mercado' }
]

export default function HeroBanner() {
  const videoRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [duration, setDuration] = useState(5)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const videoEl = videoRef.current
    if (videoEl) {
      videoEl.load()
    }
  }, [index])

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const handleCanPlay = () => {
      const dur = videoEl.duration || 5
      setDuration(dur)
      videoEl.play()
    }

    const handleEnded = () => {
      const next = (index + 1) % videos.length
      setIndex(next)
    }

    videoEl.addEventListener('canplay', handleCanPlay)
    videoEl.addEventListener('ended', handleEnded)

    return () => {
      videoEl.removeEventListener('canplay', handleCanPlay)
      videoEl.removeEventListener('ended', handleEnded)
    }
  }, [index])

  return (
    <section id="video-hero" className="relative w-full h-screen pt-[64px] overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        muted
        playsInline
        loop={false}
      >
        <source src={videos[index].src} type="video/mp4" />
      </video>

      {/* Overlay + CTA + Indicadores */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end items-center text-center text-white px-6 pb-12 bg-gradient-to-t from-black/60 via-transparent">
        <a
          href={videos[index].link}
          id="cta-button"
          className="mb-6 px-6 py-2 bg-white text-black font-semibold text-sm rounded-full hover:bg-gray-100 transition"
        >
          {videos[index].cta}
        </a>

        {/* Indicadores circulares */}
        <div className="flex justify-center gap-4">
          {videos.map((_, i) => (
            <svg
              key={i}
              className={`circle-indicator w-6 h-6 cursor-pointer ${i === index ? 'video-label-active' : ''}`}
              viewBox="0 0 36 36"
              onClick={() => setIndex(i)}
            >
              <circle
                className="bg"
                cx="18"
                cy="18"
                r="16"
                stroke="white"
                strokeWidth="3"
                fill="none"
              />
              <circle
                className="progress"
                cx="18"
                cy="18"
                r="16"
                stroke="#7fa1c7"
                strokeWidth="3"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset={i === index ? 0 : 100}
                style={{
                  transition: `stroke-dashoffset ${i === index ? duration : 0}s linear`
                }}
              />
            </svg>
          ))}
        </div>
      </div>
    </section>
  )
}