import { useRef, useState } from 'react';
import { operarCuentasTecnologia } from '../../../lib/cuentasTecnologiaApi';
import { estadoPago, hoyBogota, puedeDeshacer, siguienteRenovacion } from '../../../lib/pagosTecnologia.mjs';
import { claseBotonSecundario, claseCampo } from './radar/RadarUi.jsx';

const mostrarFecha = (value) => value?.split('-').reverse().join('/');

export default function PagoTecnologia({ cuenta, ahora, detalle = false, actualizado, Modal }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ajustar, setAjustar] = useState(false);
  const [fecha, setFecha] = useState('');
  const pending = useRef(null);
  const inFlight = useRef(false);
  const hoy = hoyBogota(new Date(ahora));
  const estado = estadoPago(cuenta, hoy);
  const ejecutar = async (accion, fechaNueva) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError('');
    const signature = `${accion}:${cuenta.pago_version}:${fechaNueva || ''}`;
    if (pending.current?.signature !== signature) pending.current = {
      signature,
      body: { id: cuenta.id, version: cuenta.pago_version, operacion_id: crypto.randomUUID(),
        ...(accion === 'deshacer_pago' ? { pago_id: cuenta.ultimo_pago_id } : {}),
        ...(fechaNueva ? { fecha_renovacion: fechaNueva } : {}) },
    };
    try {
      await operarCuentasTecnologia(accion, pending.current.body);
      pending.current = null;
      setAjustar(false);
      await actualizado(accion === 'registrar_pago' ? 'Pago registrado.' : 'Registro de pago deshecho.');
    } catch (e) {
      setError(e.message);
      if (e.codigo === 'FECHA_REQUERIDA') setAjustar(true);
      if (['CONFLICTO_PAGO', 'DESHACER_NO_DISPONIBLE'].includes(e.codigo)) {
        pending.current = null;
        await actualizado('');
      }
    } finally { inFlight.current = false; setBusy(false); }
  };
  const registrar = () => {
    const next = siguienteRenovacion(cuenta);
    if (!next || next <= hoy) { setFecha(''); setAjustar(true); }
    else ejecutar('registrar_pago');
  };
  return <div className="space-y-2" aria-label={`Pago de ${cuenta.herramienta}`}>
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${estado.color}`}>{estado.texto}</span>
    <p className="text-xs text-gray-500">{cuenta.ultimo_pago_en ? `Último pago registrado: ${mostrarFecha(hoyBogota(new Date(cuenta.ultimo_pago_en)))}` : 'Sin pago confirmado'}</p>
    <div className="flex flex-wrap items-center gap-2">
      {estado.cubierto ? <>
        <span className="text-xs font-semibold text-emerald-700">✓ Pago registrado</span>
        {detalle && <button disabled={busy} className={claseBotonSecundario} onClick={() => { setFecha(siguienteRenovacion(cuenta) || ''); setAjustar(true); }}>Registrar pago anticipado</button>}
      </> : <button disabled={busy} className={claseBotonSecundario} onClick={registrar}>{busy ? 'Guardando…' : 'Marcar pago realizado'}</button>}
      {puedeDeshacer(cuenta, ahora) && <button disabled={busy} className="text-sm font-semibold underline text-gray-600" onClick={() => ejecutar('deshacer_pago')}>Deshacer</button>}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {ajustar && <Modal titulo={`Registrar pago de ${cuenta.herramienta}`} cerrar={() => { if (!busy) setAjustar(false); }}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); ejecutar('registrar_pago', fecha); }}>
        <p className="text-sm text-gray-600">Confirma hasta cuándo queda cubierta esta herramienta con el pago que realizaste. No se registrarán pagos de otros períodos.</p>
        <label className="block text-sm font-semibold">Próxima renovación<input autoFocus required type="date" className={`${claseCampo} mt-1`} value={fecha} min={new Date(Date.parse(cuenta.fecha_renovacion > hoy ? cuenta.fecha_renovacion : hoy) + 86400000).toISOString().slice(0, 10)} onChange={(e) => setFecha(e.target.value)} /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={busy} className={claseBotonSecundario} onClick={() => setAjustar(false)}>Cancelar</button><button disabled={busy} className={claseBotonSecundario}>{busy ? 'Guardando…' : 'Confirmar pago'}</button></div>
      </form>
    </Modal>}
  </div>;
}
