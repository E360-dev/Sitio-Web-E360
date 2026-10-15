import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, PlusIcon, LockClosedIcon, LockOpenIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCredenciales } from '../../../context/CredencialesProvider';
import { obtenerCuentasTecnologia } from '../../../lib/cuentasTecnologiaApi';
import { claseBoton, claseBotonSecundario, claseCampo } from './radar/RadarUi.jsx';

const INICIAL = { herramienta: '', plan: '', correo: '', uso: '', fecha_renovacion: '', costo: '', moneda: 'COP' };
const fecha = (value) => value ? value.split('-').reverse().join('/') : 'Fecha por completar';
const costo = (value, currency) => value == null ? 'Sin costo registrado' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 2 }).format(Number(value));

function Modal({ titulo, cerrar, children }) {
  const ref = useRef(null);
  const closeRef = useRef(cerrar);
  closeRef.current = cerrar;
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const onCancel = (event) => { event.preventDefault(); closeRef.current(); };
    dialog.addEventListener('cancel', onCancel);
    return () => { dialog.removeEventListener('cancel', onCancel); dialog.close(); };
  }, []);
  return <dialog ref={ref} aria-label={titulo} className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-950/50">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white p-5 border-b">
      <h2 className="text-xl font-black text-[#1a2f4e]">{titulo}</h2>
      <button type="button" aria-label="Cerrar" onClick={cerrar} className="p-2 rounded-full hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
    </div>
    <div className="p-5">{children}</div>
  </dialog>;
}

function Formulario({ cuenta, guardar, cerrar, desbloqueada, pedirDesbloqueo }) {
  const [form, setForm] = useState(() => ({ ...INICIAL, ...cuenta, costo: cuenta?.costo ?? '', fecha_renovacion: cuenta?.fecha_renovacion || '' }));
  const [password, setPassword] = useState('');
  const [eliminarPassword, setEliminarPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!desbloqueada) setPassword(''); }, [desbloqueada]);
  const cambiar = (campo) => (event) => setForm((prev) => ({ ...prev, [campo]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await guardar({ cuenta: { ...form, costo: form.costo === '' ? null : Number(form.costo) }, contrasena: password || undefined, eliminar_contrasena: eliminarPassword });
      setPassword('');
      cerrar();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <Modal titulo={cuenta ? 'Editar cuenta' : 'Agregar cuenta'} cerrar={cerrar}>
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="text-sm font-semibold">Herramienta<input autoFocus className={`${claseCampo} mt-1`} value={form.herramienta} onChange={cambiar('herramienta')} required maxLength={120} placeholder="ChatGPT, Claude…" /></label>
      <label className="text-sm font-semibold">Plan<input className={`${claseCampo} mt-1`} value={form.plan} onChange={cambiar('plan')} required maxLength={120} placeholder="Plus, Pro, Business…" /></label>
      <label className="sm:col-span-2 text-sm font-semibold">Correo de la cuenta<input type="email" className={`${claseCampo} mt-1`} value={form.correo} onChange={cambiar('correo')} required={!cuenta} maxLength={254} autoComplete="off" placeholder="cuenta@empresa.com" /></label>
      <label className="sm:col-span-2 text-sm font-semibold">¿Para qué se usa?<textarea className={`${claseCampo} mt-1 min-h-28`} value={form.uso} onChange={cambiar('uso')} required={!cuenta} maxLength={6000} placeholder="Describe el propósito de esta cuenta, el equipo que la utiliza y cualquier indicación útil." /></label>
      <label className="text-sm font-semibold">Próxima renovación<input type="date" className={`${claseCampo} mt-1`} value={form.fecha_renovacion} onChange={cambiar('fecha_renovacion')} required={!cuenta} />{cuenta && !cuenta.fecha_renovacion && <span className="block mt-1 text-xs text-amber-700">Fecha por completar. Día registrado anteriormente: {cuenta.dia_renovacion}.</span>}</label>
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <label className="text-sm font-semibold">Costo del plan<input type="number" min="0" max="9999999999.99" step="0.01" className={`${claseCampo} mt-1`} value={form.costo} onChange={cambiar('costo')} placeholder="Opcional" /></label>
        <label className="text-sm font-semibold">Moneda<select className={`${claseCampo} mt-1`} value={form.moneda} onChange={cambiar('moneda')}><option>COP</option><option>USD</option><option>EUR</option></select></label>
      </div>
      <div className="sm:col-span-2 rounded-xl bg-slate-50 border p-4 space-y-3">
        <p className="font-bold text-sm">Contraseña de la herramienta</p>
        {desbloqueada ? <>
          <input aria-label="Nueva contraseña de la herramienta" type="password" className={claseCampo} value={password} onChange={(e) => { setPassword(e.target.value); setEliminarPassword(false); }} maxLength={4096} autoComplete="new-password" placeholder={cuenta?.tiene_contrasena ? 'Dejar vacía para conservar la actual' : 'Opcional: guardar una contraseña'} disabled={eliminarPassword} />
          {cuenta?.tiene_contrasena && <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={eliminarPassword} onChange={(e) => { setEliminarPassword(e.target.checked); setPassword(''); }} />Eliminar la contraseña guardada</label>}
        </> : <>
          <p className="text-sm text-gray-600">{cuenta?.tiene_contrasena ? 'La contraseña actual se conservará.' : 'Puedes guardar la cuenta sin contraseña.'} Para añadirla o cambiarla, desbloquea las credenciales.</p>
          <button type="button" className={claseBotonSecundario} onClick={pedirDesbloqueo}><LockClosedIcon className="h-4 w-4" />Desbloquear credenciales</button>
        </>}
      </div>
      {error && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{error}</p>}
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" className={claseBotonSecundario} onClick={cerrar} disabled={busy}>Cancelar</button><button className={claseBoton} disabled={busy}>{busy ? 'Guardando…' : 'Guardar cuenta'}</button></div>
    </form>
  </Modal>;
}

function Desbloqueo({ cerrar, desbloquear }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await desbloquear(password); setPassword(''); cerrar(); }
    catch (e) { setError(e.message); setPassword(''); }
    finally { setBusy(false); }
  };
  return <Modal titulo="Desbloquear credenciales" cerrar={cerrar}>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-600">Confirma tu contraseña de acceso a e360.pro. El desbloqueo se conserva al navegar y cambiar de pestaña; se cierra al salir, recargar la aplicación o pulsar Bloquear.</p>
      <label className="block text-sm font-semibold">Contraseña del portal<input autoFocus type="password" autoComplete="current-password" className={`${claseCampo} mt-1`} value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={4096} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className={claseBoton} disabled={busy}>{busy ? 'Verificando…' : 'Desbloquear'}</button>
    </form>
  </Modal>;
}

export default function CuentasTecnologia() {
  const vault = useCredenciales();
  const [cuentas, setCuentas] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [form, setForm] = useState(null);
  const [unlock, setUnlock] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busy, setBusy] = useState(false);
  const [filtro, setFiltro] = useState('');
  const cargar = useCallback(async () => {
    try { setCuentas(await obtenerCuentasTecnologia()); setError(''); }
    catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => () => vault.ocultar(), [vault.ocultar]);
  const detalle = cuentas?.find((c) => c.id === seleccionada);
  const cerrarDetalle = () => { setSeleccionada(null); vault.ocultar(); setMensaje(''); };
  const guardar = async (datos) => { await vault.operar('guardar', datos); await cargar(); vault.ocultar(); };
  const revelar = async (id, copiar) => {
    setBusy(true); setError(''); setMensaje('');
    try { await vault.revelar(id, copiar); if (copiar) setMensaje('Contraseña copiada.'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const eliminar = async (cuenta) => {
    if (cuenta.tiene_contrasena && !vault.desbloqueada) { setUnlock(true); return; }
    if (!window.confirm(`¿Eliminar la cuenta ${cuenta.herramienta} y su contraseña guardada?`)) return;
    setBusy(true); setError('');
    try { await vault.operar('eliminar', { id: cuenta.id }); cerrarDetalle(); await cargar(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const visibles = cuentas?.filter((c) => `${c.herramienta} ${c.plan} ${c.correo} ${c.uso}`.toLocaleLowerCase('es').includes(filtro.toLocaleLowerCase('es')));
  return <div className="space-y-6">
    <Link to="/admin/conocimiento" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#1a2f4e]"><ChevronLeftIcon className="h-4 w-4" />Centro de conocimiento</Link>
    <div className="bg-[rgb(53,92,143)] rounded-3xl px-6 py-7 text-white">
      <h1 className="text-3xl md:text-4xl font-black">Cuentas de <span className="text-[#25c6e3]">tecnología</span></h1>
      <p className="mt-2 text-white/75">Herramientas, usos, planes y credenciales del equipo. Solo administradores.</p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className={`inline-flex items-center gap-2 text-sm font-semibold ${vault.desbloqueada ? 'text-emerald-700' : 'text-gray-500'}`}>{vault.desbloqueada ? <LockOpenIcon className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5" />}{vault.desbloqueada ? 'Credenciales desbloqueadas en esta pestaña' : 'Credenciales protegidas'}</p>
      <div className="flex flex-wrap gap-2"><button className={claseBotonSecundario} onClick={() => vault.desbloqueada ? vault.bloquear() : setUnlock(true)}>{vault.desbloqueada ? 'Bloquear ahora' : 'Desbloquear credenciales'}</button><button className={claseBoton} onClick={() => setForm({ cuenta: null })}><PlusIcon className="h-4 w-4" />Agregar cuenta</button></div>
    </div>
    {error && <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}<button className="ml-3 underline" onClick={cargar}>Volver a cargar</button></div>}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b"><input aria-label="Buscar cuentas" className={claseCampo} placeholder="Buscar herramienta, correo o uso…" value={filtro} onChange={(e) => setFiltro(e.target.value)} /></div>
      {cuentas === null ? <p className="p-8 text-gray-400">Cargando cuentas…</p> : !visibles.length ? <p className="p-8 text-gray-500">{cuentas.length ? 'No hay cuentas que coincidan con la búsqueda.' : 'Aún no hay cuentas registradas.'}</p> : <ul className="divide-y divide-gray-100">
        {visibles.map((cuenta) => <li key={cuenta.id}><button onClick={() => { vault.ocultar(); setSeleccionada(cuenta.id); setMensaje(''); }} className="w-full text-left p-4 sm:p-5 hover:bg-slate-50 grid grid-cols-1 lg:grid-cols-[1.1fr_1.2fr_1fr_1fr] gap-2 lg:gap-4 items-center">
          <div><span className="font-black text-[#1a2f4e]">{cuenta.herramienta}</span><span className="block text-sm text-gray-500">{cuenta.plan}</span></div>
          <div className="text-sm break-all">{cuenta.correo || <span className="text-gray-400">Correo por completar</span>}</div>
          <div className={`text-sm ${cuenta.fecha_renovacion ? 'text-gray-600' : 'text-amber-700'}`}>{fecha(cuenta.fecha_renovacion)}</div>
          <div className="text-sm"><span>{costo(cuenta.costo, cuenta.moneda)}</span><span className="block text-xs text-gray-400 mt-1">{cuenta.tiene_contrasena ? 'Contraseña guardada' : 'Sin contraseña guardada'}</span></div>
        </button></li>)}
      </ul>}
    </div>
    {detalle && !form && <Modal titulo={detalle.herramienta} cerrar={cerrarDetalle}>
      <div className="space-y-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><dt className="text-gray-500">Plan</dt><dd className="font-semibold">{detalle.plan}</dd></div><div><dt className="text-gray-500">Costo</dt><dd className="font-semibold">{costo(detalle.costo, detalle.moneda)}</dd></div><div><dt className="text-gray-500">Correo de acceso</dt><dd className="font-semibold break-all">{detalle.correo || 'Por completar'}</dd></div><div><dt className="text-gray-500">Próxima renovación</dt><dd className="font-semibold">{fecha(detalle.fecha_renovacion)}</dd></div><div className="sm:col-span-2"><dt className="text-gray-500">¿Para qué se usa?</dt><dd className="mt-1 whitespace-pre-wrap break-words">{detalle.uso || 'Uso por completar.'}</dd></div></dl>
        <div className="rounded-xl border bg-slate-50 p-4 space-y-3">
          <h3 className="font-bold text-sm">Contraseña</h3>
          {!detalle.tiene_contrasena ? <p className="text-sm text-gray-500">No hay una contraseña guardada.</p> : !vault.desbloqueada ? <button className={claseBotonSecundario} onClick={() => setUnlock(true)}>Desbloquear para consultar</button> : <>
            <input aria-label="Contraseña guardada" className={claseCampo} type={vault.revelada?.id === detalle.id ? 'text' : 'password'} readOnly value={vault.revelada?.id === detalle.id ? vault.revelada.contrasena : '••••••••••••'} autoComplete="off" />
            <div className="flex flex-wrap gap-2"><button className={claseBotonSecundario} disabled={busy} onClick={() => vault.revelada?.id === detalle.id ? vault.ocultar() : revelar(detalle.id, false)}>{vault.revelada?.id === detalle.id ? 'Ocultar' : 'Mostrar'}</button><button className={claseBotonSecundario} disabled={busy} onClick={() => revelar(detalle.id, true)}>Copiar contraseña</button></div>
            <p className="text-xs text-gray-500">Al mostrarla se ocultará automáticamente en treinta segundos.</p>
          </>}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {mensaje && <p role="status" className="text-sm text-emerald-700">{mensaje}</p>}
        <div className="flex justify-between gap-2"><button className="text-sm font-semibold text-red-600" disabled={busy} onClick={() => eliminar(detalle)}>Eliminar cuenta</button><button className={claseBoton} onClick={() => { vault.ocultar(); setForm({ cuenta: detalle }); }}>Editar cuenta</button></div>
      </div>
    </Modal>}
    {form && <Formulario cuenta={form.cuenta} guardar={guardar} cerrar={() => setForm(null)} desbloqueada={vault.desbloqueada} pedirDesbloqueo={() => setUnlock(true)} />}
    {unlock && <Desbloqueo cerrar={() => setUnlock(false)} desbloquear={vault.desbloquear} />}
  </div>;
}
