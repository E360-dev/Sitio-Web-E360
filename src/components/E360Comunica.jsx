import React from 'react';
import { Link } from 'react-router-dom';
import Imagen from './Imagen';
import articulos from '../contenido/articulos.json';

// Antes esta sección eran tres imágenes fijas con el título dentro del pixel:
// invisible para Google y sin enlace a ninguna parte. Ahora muestra los tres
// artículos más recientes con texto real.
const recientes = articulos.slice(0, 3);

const formatearFecha = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

export default function E360Comunica() {
  if (recientes.length === 0) return null;

  return (
    <section id="e360-comunica" className="bg-white py-20 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Título con líneas decorativas */}
        <div className="flex items-center justify-center gap-6 mb-16">
          <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent via-e360-cyan to-e360-highlight"></div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-800 whitespace-nowrap">
            E360 Comunica
          </h2>
          <div className="hidden sm:block h-px flex-1 bg-gradient-to-l from-transparent via-e360-cyan to-e360-highlight"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {recientes.map((articulo) => (
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

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-e360-cyan">
                  {formatearFecha(articulo.fecha_publicacion)}
                </p>
                <h3 className="mt-2 text-lg font-bold text-gray-900 leading-snug">
                  <Link to={`/comunica/${articulo.slug}`} className="hover:text-[#2e527f] transition-colors">
                    {articulo.titulo}
                  </Link>
                </h3>
                {articulo.resumen && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {articulo.resumen}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            to="/comunica"
            className="inline-block px-8 py-3 border-2 border-[#2e527f] text-[#2e527f] font-bold rounded-full hover:bg-[#2e527f] hover:text-white transition-all"
          >
            Ver todos los artículos
          </Link>
        </div>
      </div>
    </section>
  );
}
