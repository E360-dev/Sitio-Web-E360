import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfViewer = ({ url, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const [descargando, setDescargando] = useState(false);

  const handleDownload = async () => {
    setDescargando(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo descargar el archivo.');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title || 'documento'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Si la descarga directa falla, abrir el PDF en una pestaña nueva como alternativa
      window.open(url, '_blank', 'noopener');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center bg-gray-100 py-4"
      >
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div className="flex justify-center items-center min-h-[400px]">
              <p className="text-gray-500 text-sm">Cargando documento...</p>
            </div>
          }
          error={
            <div className="flex justify-center items-center min-h-[400px]">
              <p className="text-red-500 text-sm">No se pudo cargar el documento.</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={containerWidth ?? undefined}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-white shrink-0">
        <div className="w-32 hidden sm:block"></div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
            disabled={pageNumber <= 1}
            className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-600 min-w-[130px] text-center select-none">
            Página {pageNumber} de {numPages ?? '…'}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(p + 1, numPages ?? p))}
            disabled={!numPages || pageNumber >= numPages}
            className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente →
          </button>
        </div>
        <button
          onClick={handleDownload}
          disabled={descargando}
          className="flex items-center gap-2 rounded-md bg-e360-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-e360-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors sm:w-32 justify-center shrink-0"
          title="Descargar el documento PDF"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {descargando ? 'Descargando…' : 'Descargar'}
        </button>
      </div>
    </div>
  );
};

export default PdfViewer;
