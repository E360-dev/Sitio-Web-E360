import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  obtenerArticulos,
  crearArticulo,
  cambiarPublicacion,
  eliminarArticulo,
  solicitarDespliegue,
} from '../../lib/articulosApi';

const CrearArticuloModal = ({ abierto, onCerrar, onCreado }) => {
  const [titulo, setTitulo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) setTitulo('');
  }, [abierto]);

  const enviar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const articulo = await crearArticulo(titulo);
      toast.success('Artículo creado. Ya puedes escribirlo.');
      onCreado(articulo);
      onCerrar();
    } catch (error) {
      toast.error(error.message || 'No se pudo crear el artículo.');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Nuevo artículo</h2>
        <p className="text-sm text-gray-500 mb-6">
          Empieza por el título. Podrás cambiarlo mientras siga sin publicarse.
        </p>
        <form onSubmit={enviar}>
          <label htmlFor="titulo" className="block text-gray-700 text-sm font-bold mb-2">
            Título
          </label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Impacto de las nuevas NIF en tu cierre"
            required
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onCerrar} className="px-4 py-2 text-gray-600 font-semibold">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 bg-[#2e527f] text-white font-bold rounded-lg disabled:bg-gray-400"
            >
              {guardando ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Etiqueta = ({ publicado }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-bold ${
      publicado ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
    }`}
  >
    {publicado ? 'Publicado' : 'Borrador'}
  </span>
);

export default function GestionArticulos() {
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setArticulos(await obtenerArticulos());
    } catch (error) {
      toast.error('No se pudieron cargar los artículos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alternarPublicacion = async (articulo) => {
    const publicando = !articulo.publicado;
    try {
      await cambiarPublicacion(articulo.id, publicando, articulo.fecha_publicacion);
      await cargar();

      // El contenido se empaqueta al compilar, así que publicar solo se ve
      // reflejado cuando el sitio se vuelve a desplegar.
      const disparado = await solicitarDespliegue();
      if (disparado) {
        toast.success(
          publicando
            ? 'Publicando… el artículo estará visible en el sitio en unos minutos.'
            : 'Retirado. El sitio se actualizará en unos minutos.',
          { duration: 6000 }
        );
      } else {
        toast(
          'Guardado, pero no se pudo lanzar la actualización del sitio automáticamente. Avisa a soporte técnico.',
          { duration: 8000, icon: '⚠️' }
        );
      }
    } catch (error) {
      toast.error(error.message || 'No se pudo cambiar el estado.');
    }
  };

  const borrar = async (articulo) => {
    if (!window.confirm(`¿Eliminar "${articulo.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarArticulo(articulo);
      toast.success('Artículo eliminado.');
      await cargar();
      if (articulo.publicado) await solicitarDespliegue();
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar.');
    }
  };

  const formatearFecha = (iso) =>
    iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="p-8">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">E360 Comunica</h1>
          <p className="text-gray-500 mt-1">Artículos del sitio público.</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#2e527f] text-white font-bold rounded-xl hover:bg-[#1e3a5f] transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo artículo
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : articulos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-600 font-semibold">Todavía no hay artículos.</p>
          <p className="text-gray-500 text-sm mt-2">
            El primero puede ser una de las publicaciones que mejor funcionaron en LinkedIn.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Autor</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Publicado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articulos.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{a.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/comunica/{a.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.autor || '—'}</td>
                  <td className="px-6 py-4">
                    <Etiqueta publicado={a.publicado} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatearFecha(a.fecha_publicacion)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/comunica/${a.id}`)}
                        className="p-2 text-gray-500 hover:text-[#2e527f] rounded-lg hover:bg-gray-100"
                        title="Editar"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => alternarPublicacion(a)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg ${
                          a.publicado
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {a.publicado ? 'Retirar' : 'Publicar'}
                      </button>
                      <button
                        onClick={() => borrar(a)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CrearArticuloModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={(articulo) => navigate(`/admin/comunica/${articulo.id}`)}
      />
    </div>
  );
}
