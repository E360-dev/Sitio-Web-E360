import { semaforo, diasRetraso } from '../../../../lib/radarApi';

const ESTILOS = {
  atrasado: 'bg-red-100 text-red-700',
  por_vencer: 'bg-amber-100 text-amber-700',
  a_tiempo: 'bg-emerald-100 text-emerald-700',
  hecho: 'bg-gray-100 text-gray-600',
  hecho_tarde: 'bg-gray-100 text-red-600',
};

/** Etiqueta de color según la fecha compromiso de un hito. */
export const Semaforo = ({ hito }) => {
  const estado = semaforo(hito);
  const retraso = hito ? diasRetraso(hito) : 0;
  const texto = {
    atrasado: `Atrasado +${retraso} d`,
    por_vencer: 'Por vencer',
    a_tiempo: 'A tiempo',
    hecho: 'Hecho',
    hecho_tarde: `Hecho +${retraso} d`,
  }[estado];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${ESTILOS[estado]}`}>
      {texto}
    </span>
  );
};

export const Tarjeta = ({ titulo, accion, children, className = '' }) => (
  <section className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
    {(titulo || accion) && (
      <div className="flex items-center justify-between gap-4 mb-4">
        {titulo && <h2 className="text-xs font-black uppercase tracking-widest text-[rgb(53,92,143)]">{titulo}</h2>}
        {accion}
      </div>
    )}
    {children}
  </section>
);

export const Vacio = ({ children }) => <p className="text-sm text-gray-400">{children}</p>;

export const claseBoton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(53,92,143)] px-4 py-2 text-sm font-bold text-white hover:bg-[#1a2f4e] disabled:opacity-50 transition-colors';
export const claseBotonSecundario =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors';
export const claseCampo =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-[rgb(53,92,143)] focus:outline-none focus:ring-1 focus:ring-[rgb(53,92,143)]';
