import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import EditorArticulo from './EditorArticulo';
import {
  obtenerArticulo,
  guardarArticulo,
  subirPortada,
  eliminarPortada,
  pesoDeImagen,
  generarSlug,
  LIMITE_PORTADA_BYTES,
} from '../../lib/articulosApi';

// Los nombres deben coincidir con los de OurTeam.jsx para poder enlazar cada
// artículo con la ficha de su autor en /nosotros.
const AUTORES = [
  'L.C. Arturo Barrios, MBA, MFB',
  'C.P. Fernando Vázquez, MBA',
  'C.P.C. Belén Arias',
  'C.P.C. Salvador Castillo',
];

const Campo = ({ etiqueta, ayuda, children }) => (
  <div className="mb-6">
    <label className="block text-sm font-bold text-gray-700 mb-1">{etiqueta}</label>
    {ayuda && <p className="text-xs text-gray-500 mb-2">{ayuda}</p>}
    {children}
  </div>
);

const entrada =
  'w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e527f]/30 focus:border-[#2e527f]';

const formatearPeso = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

export default function EdicionArticulo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [articulo, setArticulo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [pesoPortada, setPesoPortada] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setArticulo(await obtenerArticulo(id));
      } catch (error) {
        toast.error('No se pudo cargar el artículo.');
        navigate('/admin/comunica');
      } finally {
        setCargando(false);
      }
    })();
  }, [id, navigate]);

  // Se consulta el peso de la portada ya subida para poder avisar también de
  // las imágenes que se cargaron antes de que existiera esta comprobación.
  useEffect(() => {
    if (!articulo?.portada_url) {
      setPesoPortada(null);
      return;
    }
    pesoDeImagen(articulo.portada_url).then(setPesoPortada);
  }, [articulo?.portada_url]);

  const actualizar = (campos) => setArticulo((a) => ({ ...a, ...campos }));

  const alCambiarTitulo = (titulo) => {
    // El slug sigue al título solo mientras el artículo no se haya publicado:
    // después, cambiarlo rompería los enlaces ya indexados y compartidos.
    actualizar(articulo.publicado ? { titulo } : { titulo, slug: generarSlug(titulo) });
  };

  const alSubirPortada = async (archivo) => {
    if (!archivo) return;
    setSubiendoPortada(true);
    try {
      const url = await subirPortada(articulo.slug, archivo);
      actualizar({ portada_url: url });
      setPesoPortada(archivo.size);

      if (archivo.size > LIMITE_PORTADA_BYTES) {
        toast(
          `La imagen pesa ${formatearPeso(archivo.size)}. Conviene comprimirla ` +
            'antes de publicar: revisa el aviso de abajo.',
          { duration: 9000, icon: '⚠️' }
        );
      } else {
        toast.success('Portada subida. Recuerda guardar.');
      }
    } catch (error) {
      toast.error('No se pudo subir la portada.');
    } finally {
      setSubiendoPortada(false);
    }
  };

  const alQuitarPortada = async () => {
    if (!window.confirm('¿Quitar la portada de este artículo?')) return;
    try {
      await eliminarPortada(articulo.slug);
      await guardarArticulo(articulo.id, { portada_url: null });
      actualizar({ portada_url: null });
      setPesoPortada(null);
      toast.success('Portada eliminada.');
    } catch (error) {
      toast.error('No se pudo quitar la portada.');
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarArticulo(articulo.id, {
        titulo: articulo.titulo,
        slug: articulo.slug,
        resumen: articulo.resumen,
        autor: articulo.autor,
        portada_url: articulo.portada_url,
        // Se sanea aquí, antes de que salga del navegador: este HTML acaba
        // inyectado en el sitio público.
        contenido_html: DOMPurify.sanitize(articulo.contenido_html || ''),
      });
      toast.success(
        articulo.publicado
          ? 'Guardado. Publica de nuevo desde el listado para que los cambios salgan al sitio.'
          : 'Guardado.'
      );
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="p-8 text-gray-500">Cargando…</div>;
  if (!articulo) return null;

  return (
    <div className="p-8 max-w-5xl">
      <Toaster position="top-right" />

      <button
        onClick={() => navigate('/admin/comunica')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2e527f] mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a los artículos
      </button>

      <div className="flex items-start justify-between mb-8 gap-6">
        <h1 className="text-3xl font-bold text-gray-800">Editar artículo</h1>
        <button
          onClick={guardar}
          disabled={guardando}
          className="shrink-0 px-6 py-3 bg-[#2e527f] text-white font-bold rounded-xl hover:bg-[#1e3a5f] disabled:bg-gray-400"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <Campo etiqueta="Título">
        <input
          type="text"
          value={articulo.titulo || ''}
          onChange={(e) => alCambiarTitulo(e.target.value)}
          className={entrada}
        />
      </Campo>

      <Campo
        etiqueta="Dirección en el sitio"
        ayuda={
          articulo.publicado
            ? 'Bloqueada: el artículo ya está publicado y cambiarla rompería los enlaces compartidos.'
            : 'Se genera desde el título. Puedes ajustarla hasta la primera publicación.'
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">e360.pro/comunica/</span>
          <input
            type="text"
            value={articulo.slug || ''}
            onChange={(e) => actualizar({ slug: generarSlug(e.target.value) })}
            disabled={articulo.publicado}
            className={`${entrada} disabled:bg-gray-100 disabled:text-gray-500`}
          />
        </div>
      </Campo>

      <Campo
        etiqueta="Resumen"
        ayuda="Es lo que aparece en Google y en la tarjeta de LinkedIn al compartir. Entre 120 y 160 caracteres funciona mejor."
      >
        <textarea
          rows={3}
          value={articulo.resumen || ''}
          onChange={(e) => actualizar({ resumen: e.target.value })}
          className={entrada}
          maxLength={200}
        />
        <p className="text-xs text-gray-400 mt-1">{(articulo.resumen || '').length}/200</p>
      </Campo>

      <Campo etiqueta="Autor">
        <select
          value={articulo.autor || ''}
          onChange={(e) => actualizar({ autor: e.target.value })}
          className={entrada}
        >
          <option value="">Sin autor</option>
          {AUTORES.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Portada" ayuda="Se usa en el listado y en la tarjeta al compartir. Ideal 1200×630 píxeles.">
        {articulo.portada_url && (
          <div className="mb-3">
            <img
              src={articulo.portada_url}
              alt="Portada del artículo"
              className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
            />
            <div className="flex items-center gap-4 mt-2">
              {pesoPortada !== null && (
                <span
                  className={`text-xs font-semibold ${
                    pesoPortada > LIMITE_PORTADA_BYTES ? 'text-amber-700' : 'text-green-700'
                  }`}
                >
                  {formatearPeso(pesoPortada)}
                </span>
              )}
              <button
                type="button"
                onClick={alQuitarPortada}
                className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
              >
                Quitar portada
              </button>
            </div>
          </div>
        )}

        {pesoPortada !== null && pesoPortada > LIMITE_PORTADA_BYTES && (
          <div className="mb-3 max-w-md rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">
              Esta imagen pesa {formatearPeso(pesoPortada)} y puede afectar al rendimiento
            </p>
            <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
              Las imágenes pesadas ralentizan la carga del artículo, y la velocidad es uno de
              los factores que Google usa para posicionar. Por encima de 200 KB conviene
              comprimirla.
            </p>
            <p className="text-xs text-amber-800 mt-2 leading-relaxed">
              Pásala por{' '}
              <a
                href="https://squoosh.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                squoosh.app
              </a>{' '}
              eligiendo formato <b>WebP</b>, calidad <b>82</b> y ancho <b>1200 px</b>. Suele
              quedar por debajo de 150 KB sin diferencia visible, y luego la vuelves a subir aquí.
            </p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => alSubirPortada(e.target.files?.[0])}
          disabled={subiendoPortada}
          className="text-sm text-gray-600"
        />
        {subiendoPortada && <p className="text-xs text-gray-500 mt-1">Subiendo…</p>}
      </Campo>

      <Campo etiqueta="Contenido">
        <EditorArticulo
          contenido={articulo.contenido_html}
          onChange={(html) => actualizar({ contenido_html: html })}
        />
      </Campo>
    </div>
  );
}
