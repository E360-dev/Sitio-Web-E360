import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { crearCandidato, actualizarProspecto, viernesDeLista } from '../../../../lib/radarApi';
import { datosFicha, prepararFicha, BLOQUES_EVIDENCIA, ESTADOS_EVIDENCIA, ESTADOS_CONTACTO } from '../../../../lib/radarFicha.mjs';
import { claseCampo, claseBoton, claseBotonSecundario } from './RadarUi.jsx';

const Grupo = ({ titulo, children }) => <fieldset className="min-w-0 rounded-xl border border-gray-200 p-4"><legend className="px-1 text-sm font-bold text-[#1a2f4e]">{titulo}</legend><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div></fieldset>;
const Campo = ({ titulo, ayuda, ancho, ...props }) => <label className={`min-w-0 text-sm font-semibold text-gray-600 ${ancho ? 'sm:col-span-2' : ''}`}>{titulo}{props.rows ? <textarea {...props} className={`${claseCampo} mt-1 font-normal`} /> : <input {...props} className={`${claseCampo} mt-1 font-normal`} />}{ayuda && <span className="mt-1 block text-xs font-normal text-gray-500">{ayuda}</span>}</label>;
const Opciones = ({ titulo, opciones, value, onChange }) => <label className="min-w-0 text-sm font-semibold text-gray-600">{titulo}<select className={`${claseCampo} mt-1 font-normal`} value={value} onChange={onChange}>{Object.entries(opciones).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>;

export default function RadarFormularioFicha({ prospecto, onGuardado, onCancelar }) {
  const nuevo = !prospecto;
  const inicial = () => datosFicha(prospecto || { fecha_lista: viernesDeLista() });
  const [datos, setDatos] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const cambiar = (k) => (e) => setDatos((d) => ({ ...d, [k]: e.target.value }));
  const fila = (lista, i, k) => (e) => { const valor = e.target.value; setDatos((d) => ({ ...d, [lista]: d[lista].map((item, n) => n === i ? { ...item, [k]: valor } : item) })); };
  const quitar = (lista, i) => setDatos((d) => ({ ...d, [lista]: d[lista].filter((_, n) => n !== i) }));
  const campo = (k, titulo, extra = {}) => <Campo key={k} titulo={titulo} value={datos[k]} onChange={cambiar(k)} {...extra} />;
  const enviar = async (e) => {
    e.preventDefault(); setGuardando(true); setError('');
    try {
      const valores = prepararFicha(datos, nuevo);
      if (nuevo) await crearCandidato(valores); else await actualizarProspecto(prospecto.id, valores);
      toast.success(nuevo ? 'Candidato agregado a la lista corta.' : 'Ficha guardada.');
      if (nuevo) setDatos(inicial());
      onGuardado();
    } catch (e) { setError(e.message); } finally { setGuardando(false); }
  };
  return <form onSubmit={enviar} className="min-w-0 space-y-4" aria-label={nuevo ? 'Agregar candidato' : `Editar ficha de ${prospecto.empresa}`}>
    <p className="text-sm text-gray-500">{nuevo ? 'Los campos con * son obligatorios.' : 'Puedes completar la ficha gradualmente. Empresa y fecha de lista son obligatorias.'}</p>
    <fieldset disabled={guardando} className="min-w-0 space-y-4">
      <Grupo titulo="Identificación">
        {campo('empresa', 'Empresa *', { required: true })}{campo('sector', 'Sector')}
        {campo('ciudad', 'Ciudad de sede')}{campo('pais', 'País de sede')}
        {campo('paises_operacion', 'Países de operación', { ancho: true })}
        {campo('sitio_web', 'Sitio web o enlace registrado', { type: 'url', placeholder: 'https://' })}
        <Opciones titulo="Tipo del enlace registrado" opciones={{ sin_definir: 'Sin definir (enlace anterior)', web: 'Sitio web', linkedin: 'LinkedIn de empresa' }} value={datos.tipo_sitio_web} onChange={cambiar('tipo_sitio_web')} />
        {campo('linkedin_empresa', 'LinkedIn de empresa', { type: 'url', placeholder: 'https://' })}
        {campo('fecha_lista', 'Lista del viernes *', { type: 'date', required: true })}
        {campo('score', 'Score (opcional)', { type: 'number', min: 0, step: 1 })}
      </Grupo>
      <Grupo titulo="Entendimiento de la empresa">
        {campo('que_hace', `Qué hace${nuevo ? ' *' : ''}`, { rows: 3, required: nuevo, ayuda: 'Qué vende, a quién y para qué lo compran.', ancho: true })}
        {campo('como_opera', 'Cómo opera', { rows: 3, ayuda: 'Cómo genera ingresos; líneas de negocio, proyectos, entidades y socios relevantes.', ancho: true })}
        {campo('tamano_estructura', 'Tamaño y estructura', { rows: 3, ayuda: 'Puedes registrar rangos, estimaciones distintas y pertenencia a un grupo. Asocia sus fuentes abajo.', ancho: true })}
      </Grupo>
      <Grupo titulo="Señal e hipótesis comercial">
        {campo('senal', `Qué pasó · Señal${nuevo ? ' *' : ''}`, { rows: 3, required: nuevo, ancho: true })}
        {campo('senal_fecha', 'Fecha del evento', { type: 'date' })}{campo('senal_fuente', 'Enlace de la fuente', { type: 'url', placeholder: 'https://' })}
        {campo('por_que_ahora', `Por qué investigarla · Hipótesis${nuevo ? ' *' : ''}`, { rows: 3, required: nuevo, ancho: true, ayuda: 'Conecta la señal con una necesidad posible y el encaje con E360. No implica intención de compra confirmada.' })}
      </Grupo>
      <Grupo titulo="Servicios por explorar">
        {campo('servicio_principal', `Servicio principal${nuevo ? ' *' : ''}`, { required: nuevo, ancho: true })}
        {campo('servicios', 'Justificación y otros servicios posibles', { rows: 3, ancho: true })}
      </Grupo>
      <Grupo titulo="Con quién conversar">
        {datos.contactos.map((c, i) => <div key={i} className="min-w-0 space-y-3 rounded-lg bg-gray-50 p-3 sm:col-span-2"><p className="text-sm font-bold">Contacto {i + 1}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo titulo="Nombre *" value={c.nombre} onChange={fila('contactos', i, 'nombre')} required />
          <Campo titulo="Cargo" value={c.cargo} onChange={fila('contactos', i, 'cargo')} />
          <Campo titulo="LinkedIn del contacto" type="url" value={c.linkedin} onChange={fila('contactos', i, 'linkedin')} />
          <Opciones titulo="Validación del cargo" opciones={ESTADOS_CONTACTO} value={c.estado} onChange={fila('contactos', i, 'estado')} />
        </div><button type="button" className={claseBotonSecundario} onClick={() => quitar('contactos', i)}>Quitar contacto {i + 1}</button></div>)}
        <button type="button" className={claseBotonSecundario} onClick={() => setDatos((d) => ({ ...d, contactos: [...d.contactos, { nombre: '', cargo: '', linkedin: '', estado: 'por_validar' }] }))}>Agregar contacto</button>
      </Grupo>
      <Grupo titulo="Pendientes y evidencia">
        {campo('pendientes_validar', 'Qué falta validar', { rows: 3, ancho: true })}{campo('investigado_el', 'Fecha de investigación', { type: 'date' })}
        <p className="text-xs text-gray-500 sm:col-span-2">Cada evidencia indica a qué bloque corresponde y qué dato respalda. Registrar fuentes no equivale a aprobación del equipo.</p>
        {datos.evidencias.map((ev, i) => <div key={i} className="min-w-0 space-y-3 rounded-lg bg-gray-50 p-3 sm:col-span-2"><p className="text-sm font-bold">Evidencia {i + 1}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Opciones titulo="Bloque" opciones={BLOQUES_EVIDENCIA} value={ev.bloque} onChange={fila('evidencias', i, 'bloque')} />
          <Opciones titulo="Estado del dato" opciones={ESTADOS_EVIDENCIA} value={ev.estado} onChange={fila('evidencias', i, 'estado')} />
          <Campo titulo="Fuente y dato que respalda *" value={ev.nombre} onChange={fila('evidencias', i, 'nombre')} required ancho />
          <Campo titulo="Enlace de la fuente" type="url" value={ev.enlace} onChange={fila('evidencias', i, 'enlace')} required={ev.estado === 'con_fuente'} />
          <Campo titulo="Fecha de consulta" type="date" value={ev.fecha_consulta} onChange={fila('evidencias', i, 'fecha_consulta')} required={ev.estado === 'con_fuente'} />
        </div><button type="button" className={claseBotonSecundario} onClick={() => quitar('evidencias', i)}>Quitar evidencia {i + 1}</button></div>)}
        <button type="button" className={claseBotonSecundario} onClick={() => setDatos((d) => ({ ...d, evidencias: [...d.evidencias, { bloque: 'entendimiento', nombre: '', enlace: '', fecha_consulta: '', estado: 'por_validar' }] }))}>Agregar evidencia</button>
      </Grupo>
    </fieldset>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">{onCancelar && <button type="button" className={claseBotonSecundario} disabled={guardando} onClick={onCancelar}>Cancelar</button>}<button type="submit" className={claseBoton} disabled={guardando}>{guardando ? 'Guardando…' : nuevo ? 'Agregar a la lista corta' : 'Guardar ficha'}</button></div>
  </form>;
}
