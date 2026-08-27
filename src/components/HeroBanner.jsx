import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// Updated video data with optimized names
const desktopVideos = [
  { src: '/videos/Video_1_Optimized.mp4', cta: 'Conoce nuestros servicios →', link: '/servicios' },
  { src: '/videos/Video_2_Optimized.mp4', cta: 'Descubre nuestro enfoque →', link: '/nosotros' },
  { src: '/videos/Video_3_Optimized.mp4', cta: 'Explora nuestro impacto →', link: '/#impacto' }
];

const mobileVideo = { src: '/videos/Video_Mobile_Optimized.mp4', cta: 'Conoce e360 →', link: '/servicios' };

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handles the video transition (only for desktop)
  const handleVideoEnded = () => {
    if (!isMobile) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % desktopVideos.length);
    }
  };

  // Sets the video duration once the video metadata is loaded
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(videoElement.duration);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentIndex, isMobile]);

  const currentVideo = isMobile ? mobileVideo : desktopVideos[currentIndex];

  return (
    <section id="video-hero" className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-e360-dark mt-20">
      {/* El hero es solo video, sin texto. Este h1 da la jerarquía semántica que
          necesitan los buscadores sin alterar el diseño. */}
      <h1 className="sr-only">
        E360 — Consultoría financiera, auditoría y financiamiento para empresas en México
      </h1>

      <video
        key={isMobile ? 'mobile' : currentIndex} // Force re-mount on video change or mode change
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        muted
        playsInline
        loop={isMobile} // Loop the single mobile video
        onEnded={handleVideoEnded}
      >
        <source src={currentVideo.src} type="video/mp4" />
        Tu navegador no soporta videos HTML5.
      </video>

      <div className="absolute inset-0 z-10 flex flex-col justify-end items-center text-center text-white px-6 pb-8 bg-gradient-to-t from-black/70 via-transparent">
        {/* CTA Button */}
        <Link
          to={currentVideo.link}
          className="mb-4 px-6 py-2 bg-gradient-to-r from-e360-cyan to-e360-accent text-white font-bold text-sm rounded-full hover:bg-e360-dark transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {currentVideo.cta}
        </Link>

        {/* Progress Indicators (Only for Desktop) */}
        {!isMobile && (
          <div className="flex justify-center items-center gap-4">
            {desktopVideos.map((_, index) => (
              <div
                key={index}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setCurrentIndex(index)}
              >
                <svg className="w-6 h-6" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                  />
                  {index === currentIndex && (
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      transform="rotate(-90 18 18)"
                      style={{
                        animation: `fill-circle ${videoDuration}s linear forwards`
                      }}
                    />
                  )}
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes fill-circle {
            from {
              stroke-dashoffset: 100;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
    </section>
  );
}
