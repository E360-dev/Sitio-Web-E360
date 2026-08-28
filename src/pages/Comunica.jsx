import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import Imagen from '../components/Imagen';
import articulos from '../contenido/articulos.json';

export const formatearFecha = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

export default function Comunica() {
  return (
    <main className="pt-32 pb-24 bg-white">
      <Seo
        title="E360 Comunica | Análisis financiero, fiscal y de auditoría"
        description="Artículos de los socios de E360 sobre auditoría, estrategia fiscal, financiamiento y cierres contables. Criterio técnico aplicado a decisiones reales."
        path="/comunica"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-base font-semibold leading-7 text-e360-cyan">Conocimiento aplicado</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-[#2e527f]">
            E360 Comunica
          </h1>
          <div className="h-1 w-[24rem] max-w-full mx-auto mt-6 flex rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-black" />
            <div className="h-full w-1/3 bg-[#25c6e3]" />
            <div className="h-full w-1/3 bg-[#E91E63]" />
          </div>
          <p className="mt-8 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Lo que aprendemos resolviendo lo complejo, explicado sin tecnicismos innecesarios.
          </p>
        </div>

        {articulos.length === 0 ? (
          <p className="text-center text-gray-500 py-16">
            Estamos preparando los primeros artículos. Vuelve pronto.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articulos.map((articulo) => (
              <article key={articulo.slug} className="flex flex-col group">
                <Link to={`/comunica/${articulo.slug}`} className="block">
                  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-lg transition-shadow">
                    {articulo.portada_url ? (
                      <Imagen
                        src={articulo.portada_url}
                        alt={articulo.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#2e527f] to-[#25c6e3]" />
                    )}
                  </div>
                </Link>

                <div className="mt-6 flex-1 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-wider text-e360-cyan">
                    {formatearFecha(articulo.fecha_publicacion)}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
                    <Link to={`/comunica/${articulo.slug}`} className="hover:text-[#2e527f] transition-colors">
                      {articulo.titulo}
                    </Link>
                  </h2>
                  {articulo.resumen && (
                    <p className="mt-3 text-gray-600 leading-relaxed flex-1">{articulo.resumen}</p>
                  )}
                  {articulo.autor && (
                    <p className="mt-4 text-sm font-semibold text-gray-500">{articulo.autor}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
