import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerDocumentoPorUuid,
  subirPdfYAsociar,
  subirPdfReemplazoPendiente,
  emitirDocumento,
  confirmarReemplazoDocumento,
  cancelarReemplazoDocumento,
  calcularHashSha256,
  actualizarNombreDocumento,
  actualizarFechaEmision
} from '../../lib/documentosApi';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { toast, Toaster } from 'react-hot-toast';

const AdminDocumentDetail = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [editableName, setEditableName] = useState('');
  const [editableDate, setEditableDate] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [confirmingReplacement, setConfirmingReplacement] = useState(false);
  const [cancelingReplacement, setCancelingReplacement] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const data = await obtenerDocumentoPorUuid(uuid);
        if (data) {
          setDocument(data);
          setEditableName(data.nombre_documento);
          setEditableDate(data.fecha_emision ? data.fecha_emision.slice(0, 10) : '');
        } else {
          setError('Documento no encontrado.');
          toast.error('Documento no encontrado.');
        }
      } catch (err) {
        setError('Error al cargar el documento.');
        toast.error('Error al cargar el documento.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchDocument();
  }, [uuid]);

  useEffect(() => {
    if (document?.nombre_documento) {
      setEditableName(document.nombre_documento);
    }
  }, [document?.nombre_documento]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !document) {
      toast.error('Selecciona un archivo válido.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashDocumento = await calcularHashSha256(arrayBuffer);

      const response = await subirPdfYAsociar(
        document.id,
        document.uuid,
        file,
        hashDocumento
      );

      if (response.success) {
        setDocument((prev) => ({
          ...prev,
          ruta_storage_pdf: response.ruta_storage_pdf,
          hash_documento: response.hash_documento,
        }));
        setFile(null);
        toast.success('PDF subido correctamente.');
      } else {
        toast.error(response.error || 'Error al subir el PDF.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadReplacement = async () => {
    if (!file || !document) {
      toast.error('Selecciona un archivo válido.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashDocumento = await calcularHashSha256(arrayBuffer);

      const response = await subirPdfReemplazoPendiente(
        document.id,
        document.uuid,
        file,
        hashDocumento,
        document.ruta_storage_pdf_pendiente
      );

      if (response.success) {
        setDocument((prev) => ({
          ...prev,
          ruta_storage_pdf_pendiente: response.ruta_storage_pdf_pendiente,
          hash_documento_pendiente: response.hash_documento_pendiente,
        }));
        setFile(null);
        toast.success('Reemplazo cargado. Falta confirmarlo para publicarlo.');
      } else {
        toast.error(response.error || 'Error al subir el reemplazo.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleEmit = async () => {
    if (!document?.hash_documento) {
      toast.error('Debes subir un PDF antes de emitir.');
      return;
    }

    setEmitting(true);
    setError(null);

    try {
      const response = await emitirDocumento(document.id, document.hash_documento);
      if (response.success) {
        toast.success('Documento emitido.');
        navigate('/admin');
      } else {
        toast.error(response.error || 'Error al emitir.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setEmitting(false);
    }
  };

  const handleConfirmReplacement = async () => {
    if (!document?.ruta_storage_pdf_pendiente || !document?.hash_documento_pendiente) {
      toast.error('No hay un reemplazo pendiente para publicar.');
      return;
    }

    setConfirmingReplacement(true);
    setError(null);

    try {
      const response = await confirmarReemplazoDocumento(document);
      if (response.success) {
        setDocument((prev) => ({
          ...prev,
          ruta_storage_pdf: response.ruta_storage_pdf,
          hash_documento: response.hash_documento,
          ruta_storage_pdf_pendiente: null,
          hash_documento_pendiente: null,
        }));
        toast.success('El nuevo PDF ya está visible en la misma página emitida.');
      } else {
        toast.error(response.error || 'Error al confirmar el reemplazo.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setConfirmingReplacement(false);
    }
  };

  const handleCancelReplacement = async () => {
    if (!document?.ruta_storage_pdf_pendiente) {
      toast.error('No hay un reemplazo pendiente para cancelar.');
      return;
    }

    setCancelingReplacement(true);
    setError(null);

    try {
      const response = await cancelarReemplazoDocumento(document);
      if (response.success) {
        setDocument((prev) => ({
          ...prev,
          ruta_storage_pdf_pendiente: null,
          hash_documento_pendiente: null,
        }));
        setFile(null);
        toast.success('Se canceló el reemplazo pendiente.');
      } else {
        toast.error(response.error || 'Error al cancelar el reemplazo.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setCancelingReplacement(false);
    }
  };

  const handleSaveName = async () => {
    if (!document || editableName.trim() === '') {
      toast.error('El nombre no puede estar vacío.');
      return;
    }

    if (editableName === document.nombre_documento) {
      toast('El nombre no cambió.', { icon: 'i' });
      return;
    }

    setSavingName(true);
    setError(null);

    try {
      const response = await actualizarNombreDocumento(document.id, editableName);
      if (response.success) {
        setDocument((prev) => ({
          ...prev,
          nombre_documento: response.nombre_documento,
        }));
        toast.success('Nombre actualizado.');
      } else {
        toast.error(response.error || 'Error al actualizar.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveDate = async () => {
    if (!document || editableDate.trim() === '') {
      toast.error('La fecha no puede estar vacía.');
      return;
    }

    if (editableDate === document.fecha_emision?.slice(0, 10)) {
      toast('La fecha no cambió.', { icon: 'i' });
      return;
    }

    setSavingDate(true);
    setError(null);

    try {
      const response = await actualizarFechaEmision(document.id, editableDate);
      if (response.success) {
        setDocument((prev) => ({ ...prev, fecha_emision: response.fecha_emision }));
        toast.success('Fecha de emisión actualizada.');
      } else {
        toast.error(response.error || 'Error al actualizar la fecha.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setSavingDate(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Cargando...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
  if (!document) return <div className="p-4 text-center">Documento no encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="relative mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg md:p-8">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 z-10 rounded-full bg-white p-2 text-gray-700 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>

        <h2 className="mb-6 ml-12 text-center text-2xl font-bold text-gray-800">
          Detalle del Documento Admin
        </h2>

        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center text-sm font-semibold text-blue-800">
              <InformationCircleIcon className="mr-1 h-4 w-4" />
              URL para Código QR
            </span>
            <button
              onClick={() => {
                const url = `${window.location.origin}/documento/${uuid}`;
                navigator.clipboard.writeText(url);
                toast.success('Enlace copiado.');
              }}
              className="rounded bg-blue-600 px-3 py-1 text-xs text-white transition hover:bg-blue-700"
            >
              Copiar Enlace
            </button>
          </div>
          <p className="break-all rounded border border-blue-100 bg-white p-2 font-mono text-xs text-blue-600">
            {`${window.location.origin}/documento/${uuid}`}
          </p>
          <p className="mt-2 text-[10px] text-blue-500">
            Esta URL permanece igual aunque se reemplace el PDF publicado.
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex items-center">
            <strong className="w-24 text-gray-600">Nombre:</strong>
            {document.estado !== 'emitido' ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={savingName}
                />
                <button
                  onClick={handleSaveName}
                  disabled={
                    savingName ||
                    editableName === document.nombre_documento ||
                    editableName.trim() === ''
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingName ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ) : (
              <p className="flex-1 font-medium">{document.nombre_documento}</p>
            )}
          </div>

          <div className="flex items-center">
            <strong className="w-24 text-gray-600">Estado:</strong>
            <p className="flex-1">{document.estado}</p>
          </div>

          {document.estado === 'emitido' && (
            <div className="flex items-center">
              <strong className="w-24 text-gray-600">Fecha emisión:</strong>
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="date"
                  value={editableDate}
                  onChange={(e) => setEditableDate(e.target.value)}
                  className="block rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={savingDate}
                />
                <button
                  onClick={handleSaveDate}
                  disabled={
                    savingDate ||
                    editableDate === document.fecha_emision?.slice(0, 10) ||
                    editableDate.trim() === ''
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingDate ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {document.estado === 'borrador' && (
          <div className="mt-6">
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Subir PDF'}
            </button>
          </div>
        )}

        {document.estado === 'borrador' && document.hash_documento && (
          <div className="mt-6">
            <button
              onClick={handleEmit}
              disabled={emitting}
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {emitting ? 'Emitiendo...' : 'Emitir Documento'}
            </button>
          </div>
        )}

        {document.estado === 'emitido' && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Reemplazar PDF en esta misma página</p>
              <p className="mt-1 text-sm text-amber-800">
                La URL no cambia. El archivo nuevo solo se publica cuando confirmes el reemplazo.
              </p>

              <div className="mt-4">
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                <button
                  onClick={handleUploadReplacement}
                  disabled={!file || uploading}
                  className="mt-3 rounded-md bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Cargar reemplazo pendiente'}
                </button>
              </div>

              {document.ruta_storage_pdf_pendiente && (
                <div className="mt-4 rounded-md border border-amber-300 bg-white p-3">
                  <p className="text-sm font-medium text-amber-900">
                    Hay un reemplazo pendiente listo para publicar.
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-amber-700">
                    {document.ruta_storage_pdf_pendiente}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={handleConfirmReplacement}
                      disabled={confirmingReplacement || cancelingReplacement}
                      className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {confirmingReplacement ? 'Confirmando...' : 'Confirmar y publicar'}
                    </button>
                    <button
                      onClick={handleCancelReplacement}
                      disabled={cancelingReplacement || confirmingReplacement}
                      className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelingReplacement ? 'Cancelando...' : 'Cancelar reemplazo'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/documento/${uuid}`)}
              className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Ver Documento Público
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDocumentDetail;
