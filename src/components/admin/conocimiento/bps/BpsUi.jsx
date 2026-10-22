export const botonBps='inline-flex items-center justify-center rounded-lg bg-[rgb(53,92,143)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
export const secundarioBps='inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 disabled:opacity-50';
export const campoBps='w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-50 disabled:text-gray-500';
export function TarjetaBps({titulo,children}) { return <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">{titulo&&<h2 className="mb-4 font-bold text-[#1a2f4e]">{titulo}</h2>}{children}</section>; }
export function ErrorBps({error,reintentar}) { return error?<div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error} {reintentar&&<button type="button" onClick={reintentar} className="ml-2 underline">Reintentar / recargar</button>}</div>:null; }
export function EtiquetaBps({children}) { return <span className="inline-block rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-[#1a2f4e]">{children}</span>; }
export function CampoBps({titulo,children}) { return <label className="block min-w-0 text-sm font-semibold text-gray-600"><span className="mb-1 block">{titulo}</span>{children}</label>; }
