import { Link } from 'react-router-dom';

export default function AcademyHero() {
  return (
    <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      {/* Content */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center text-center text-white px-6">
        <h2 className="text-base font-semibold leading-7 text-blue-400 animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
          DESARROLLO Y CONOCIMIENTO
        </h2>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-tight animate-fade-in-down">
          Inicia tu Carrera en la Vanguardia Financiera
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-gray-300 sm:text-xl animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          Nuestra academia es el punto de partida para talentos que buscan dominar la auditoría y la tecnología del futuro. Aprende de expertos, trabaja en proyectos reales y crece con nosotros.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <Link
            to="/academia#join-us"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Únete al Equipo
          </Link>
          <Link
            to="/academia#recursos"
            className="px-8 py-3 bg-gray-700/50 text-gray-200 font-semibold rounded-full hover:bg-gray-700/80 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Explora Recursos
          </Link>
        </div>
      </div>

      {/* Keyframes for animations */}
      <style>
        {`
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in-down {
            animation: fade-in-down 1s ease-out forwards;
          }

          .animate-fade-in-up {
            animation: fade-in-up 1s ease-out forwards;
          }
        `}
      </style>
    </section>
  );
}
