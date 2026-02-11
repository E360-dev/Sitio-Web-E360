import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerDocumentoPorUuid, subirPdfYAsociar, emitirDocumento, calcularHashSha256 } from '../../lib/documentosApi';

const AdminDocumentDetail = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [emitting, setEmitting] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const data = await obtenerDocumentoPorUuid(uuid);
        if (data) {
          setDocument(data);
        } else {
          setError('Documento no encontrado.');
        }
      } catch (err) {
        setError('Error al cargar el documento.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchDocument();
    }
  }, [uuid]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !document) return;

    setUploading(true);
    setError(null);
    try {
      // Leer el archivo como ArrayBuffer para calcular el hash
      const arrayBuffer = await file.arrayBuffer();
      const hashDocumento = await calcularHashSha256(arrayBuffer);

      const response = await subirPdfYAsociar(document.id, document.uuid, file, hashDocumento);
      if (response.success) {
        setDocument((prev) => ({
          ...prev,
          ruta_storage_pdf: response.ruta_storage_pdf,
          hash_documento: response.hash_documento,
        }));
        alert('PDF subido y asociado correctamente.');
      } else {
        setError(response.error ? `Error al subir el PDF: ${response.error}` : 'Error desconocido al subir el PDF.');
      }
    } catch (err) {
      setError(`Error en la subida del PDF: ${err.message || err.toString()}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleEmit = async () => {
    if (!document || !document.hash_documento) {
      setError('No se puede emitir un documento sin un PDF y un hash.');
      return;
    }

    setEmitting(true);
    setError(null);
    try {
      const response = await emitirDocumento(document.id, document.hash_documento);
      if (response.success) {
        alert('Documento emitido correctamente.');
        navigate('/admin-dashboard'); // Redirigir al dashboard principal del admin
      } else {
        // Esto podría ocurrir si la RPC falla pero no lanza una excepción, solo retorna un error en 'data'
        setError(response.error || 'Error desconocido al emitir el documento.');
      }
    } catch (err) {
      // Captura de errores lanzados por emitirDocumento
      setError(`Error en la emisión del documento: ${err.message || err.toString()}`);
      console.error(err);
    } finally {
      setEmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4">Cargando documento...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!document) {
    return <div className="p-4">Documento no encontrado.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Detalle del Documento Admin</h2>
      <div className="mb-4">
        <p><strong>Nombre:</strong> {document.nombre_documento}</p>
        <p><strong>Cliente:</strong> {document.clientes?.nombre || 'N/A'}</p>
        <p><strong>Estado:</strong> {document.estado}</p>
        <p><strong>Ruta PDF:</strong> {document.ruta_storage_pdf || 'No subido'}</p>
        <p><strong>Hash:</strong> {document.hash_documento || 'No calculado'}</p>
      </div>

      {document.estado === 'borrador' && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Subir PDF</h3>
          <input type="file" accept="application/pdf" onChange={handleFileChange} className="mb-2" />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : 'Subir PDF'}
          </button>
        </div>
      )}

      {document.estado === 'borrador' && document.hash_documento && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Emitir Documento</h3>
          <button
            onClick={handleEmit}
            disabled={emitting || uploading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {emitting ? 'Emitiendo...' : 'Emitir Documento'}
          </button>
        </div>
      )}

      {document.estado === 'emitido' && (
        <div className="mb-4 text-green-600">
          Este documento ya ha sido emitido.
          <button onClick={() => navigate(`/documento/${uuid}`)} className="ml-4 bg-gray-300 text-gray-800 px-3 py-1 rounded">
            Ver Documento Público
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentDetail;
