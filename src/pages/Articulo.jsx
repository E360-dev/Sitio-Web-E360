import { useParams, Link } from 'react-router-dom';
import Seo, { SITE_URL } from '../components/Seo';
import Imagen from '../components/Imagen';
import NotFoundPage from './NotFoundPage';
import articulos from '../contenido/articulos.json';
import { formatearFecha } from './Comunica';

export default function Articulo() {
  const { slug } = useParams();
  const articulo = articulos.find((a) => a.slug === slug);

  if (!articulo) return <NotFoundPage />;

  const url = `${SITE_URL}/comunica/${articulo.slug}`;

  // Datos estructurados: es lo que permite a Google mostrar autor y fecha en
  // los resultados en lugar de un enlace plano.
  const datosEstructurados = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articulo.titulo,
    description: articulo.resumen || undefined,
    image: articulo.portada_url || undefined,
    datePublished: articulo.fecha_publicacion || undefined,
    dateModified: articulo.actualizado_en || articulo.fecha_publicacion || undefined,
    author: articulo.autor ? { '@type': 'Person', name: articulo.autor } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'E360',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/img/logo1.webp` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <main className="pt-32 pb-24 bg-white">
      <Seo
        title={`${articulo.titulo} | E360 Comunica`}
        description={articulo.resumen || `Artículo de E360 sobre ${articulo.titulo}.`}
        path={`/comunica/${articulo.slug}`}
        image={articulo.portada_url || undefined}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />

      <article className="max-w-3xl mx-auto px-6 lg:px-8">
        <Link
          to="/comunica"
          className="text-sm font-semibold text-e360-cyan hover:text-[#2e527f] transition-colors"
        >
          ← E360 Comunica
        </Link>

        <header className="mt-8 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            {articulo.titulo}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            {articulo.autor && (
              <Link to="/nosotros#equipo" className="font-semibold text-[#2e527f] hover:underline">
                {articulo.autor}
              </Link>
            )}
            {articulo.autor && articulo.fecha_publicacion && <span aria-hidden="true">·</span>}
            {articulo.fecha_publicacion && (
              <time dateTime={articulo.fecha_publicacion}>
                {formatearFecha(articulo.fecha_publicacion)}
              </time>
            )}
          </div>

          {articulo.resumen && (
            <p className="mt-8 text-xl leading-relaxed text-gray-600 border-l-4 border-e360-cyan pl-6">
              {articulo.resumen}
            </p>
          )}
        </header>

        {articulo.portada_url && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-lg">
            <Imagen
              src={articulo.portada_url}
              alt={articulo.titulo}
              className="w-full h-auto object-cover"
              lazy={false}
            />
          </div>
        )}

        {/* El HTML se saneó con DOMPurify al guardarlo desde el panel. */}
        <div
          className="prose-e360"
          dangerouslySetInnerHTML={{ __html: articulo.contenido_html || '' }}
        />

        <footer className="mt-16 pt-10 border-t border-gray-200">
          <p className="text-lg font-bold text-[#2e527f]">¿Esto le aplica a tu empresa?</p>
          <p className="mt-2 text-gray-600">
            Cuéntanos tu situación y te decimos con claridad qué conviene hacer.
          </p>
          <Link
            to="/contacto"
            className="mt-6 inline-block px-8 py-3 bg-[#2e527f] text-white font-bold rounded-full hover:bg-[#1e3a5f] transition-colors shadow-lg"
          >
            Hablemos
          </Link>
        </footer>
      </article>
    </main>
  );
}
