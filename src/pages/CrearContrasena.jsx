import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fondoWebp } from '../components/Imagen';

// Crear o cambiar la contraseña. Tres entradas posibles:
//   - Enlace del correo de invitación o recuperación: ?token_hash=...&type=invite|recovery
//     (las plantillas de correo de Supabase apuntan aquí).
//   - Sesión ya iniciada: la persona cambia su contraseña.
//   - Sin sesión ni enlace: se pide el correo y se envía un enlace de recuperación.

const MINIMO = 8;

const campo =
  'w-full px-6 py-4 bg-white border-2 border-gray-600 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#25c6e3] focus:border-[#25c6e3] transition-all text-lg';
const boton =
  'w-full py-4 bg-[#25c6e3] hover:bg-[#1fb5d0] text-white font-bold text-lg rounded-full shadow-sm transition-all disabled:opacity-60';

const validar = (clave, repetida) => {
  if (clave.length < MINIMO) return `La contraseña debe tener al menos ${MINIMO} caracteres.`;
  if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) return 'Usa al menos una letra y un número.';
  if (clave !== repetida) return 'Las contraseñas no coinciden.';
  return null;
};

export default function CrearContrasena() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // cargando | formulario | pedir-enlace | enlace-enviado | listo
  const [paso, setPaso] = useState('cargando');
  const [esInvitacion, setEsInvitacion] = useState(false);
  const [clave, setClave] = useState('');
  const [repetida, setRepetida] = useState('');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const iniciar = async () => {
      const tokenHash = params.get('token_hash');
      const tipo = params.get('type');

      if (tokenHash && (tipo === 'invite' || tipo === 'recovery')) {
        const { error: errorEnlace } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
        if (errorEnlace) {
          setError('El enlace no es válido o ya caducó. Pide uno nuevo con tu correo.');
          setPaso('pedir-enlace');
          return;
        }
        setEsInvitacion(tipo === 'invite');
        // El token no debe quedarse en la barra de direcciones ni en el historial.
        window.history.replaceState(null, '', '/crear-contrasena');
        setPaso('formulario');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setPaso(session ? 'formulario' : 'pedir-enlace');
    };
    iniciar();
  }, [params]);

  const guardarClave = async (e) => {
    e.preventDefault();
    const problema = validar(clave, repetida);
    if (problema) return setError(problema);

    setError(null);
    setEnviando(true);
    const { error: errorGuardar } = await supabase.auth.updateUser({ password: clave });
    setEnviando(false);

    if (errorGuardar) {
      setError(
        errorGuardar.message.includes('different from the old')
          ? 'La nueva contraseña debe ser distinta de la anterior.'
          : `No se pudo guardar la contraseña: ${errorGuardar.message}`
      );
      return;
    }

    // Se cierra la sesión para que entre con la contraseña nueva y el login
    // lo lleve a su panel según su rol.
    await supabase.auth.signOut();
    setPaso('listo');
  };

  const pedirEnlace = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: errorEnvio } = await supabase.auth.resetPasswordForEmail(correo.trim());
    setEnviando(false);
    if (errorEnvio) {
      setError(`No se pudo enviar el correo: ${errorEnvio.message}`);
      return;
    }
    // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
    setPaso('enlace-enviado');
  };

  const titulos = {
    cargando: 'Un momento...',
    formulario: esInvitacion ? 'Crea tu contraseña' : 'Nueva contraseña',
    'pedir-enlace': 'Recupera tu acceso',
    'enlace-enviado': 'Revisa tu correo',
    listo: 'Contraseña guardada',
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: fondoWebp('/img/fondologin.jpg') }}
    >
      <div className="absolute inset-0 bg-[#143c64]/70"></div>

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        <h2 className="text-4xl font-extrabold text-white mb-8 text-center tracking-tight">{titulos[paso]}</h2>

        <div className="bg-white w-full py-12 px-10 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          {paso === 'cargando' && <p className="text-center text-gray-500">Verificando tu enlace...</p>}

          {paso === 'formulario' && (
            <form className="space-y-6" onSubmit={guardarClave}>
              <p className="text-sm text-gray-600 text-center">
                Mínimo {MINIMO} caracteres, con al menos una letra y un número. No la compartas con nadie.
              </p>
              <input type="password" required autoComplete="new-password" placeholder="Nueva contraseña"
                value={clave} onChange={(e) => setClave(e.target.value)} className={campo} />
              <input type="password" required autoComplete="new-password" placeholder="Repite la contraseña"
                value={repetida} onChange={(e) => setRepetida(e.target.value)} className={campo} />
              {error && <p className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-600 text-center">{error}</p>}
              <button type="submit" disabled={enviando} className={boton}>
                {enviando ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          )}

          {paso === 'pedir-enlace' && (
            <form className="space-y-6" onSubmit={pedirEnlace}>
              <p className="text-sm text-gray-600 text-center">
                Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
              </p>
              <input type="email" required autoComplete="email" placeholder="Tu correo"
                value={correo} onChange={(e) => setCorreo(e.target.value)} className={campo} />
              {error && <p className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-600 text-center">{error}</p>}
              <button type="submit" disabled={enviando} className={boton}>
                {enviando ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}

          {paso === 'enlace-enviado' && (
            <p className="text-center text-gray-600">
              Si el correo pertenece a una cuenta, en unos minutos recibirás un enlace de <strong>info@e360.pro</strong>.
              Revisa también la carpeta de spam.
            </p>
          )}

          {paso === 'listo' && (
            <div className="space-y-6 text-center">
              <p className="text-gray-600">Ya puedes iniciar sesión con tu correo y tu nueva contraseña.</p>
              <button type="button" onClick={() => navigate('/login', { replace: true })} className={boton}>
                Ir a iniciar sesión
              </button>
            </div>
          )}

          {(paso === 'pedir-enlace' || paso === 'enlace-enviado') && (
            <p className="text-center text-sm">
              <Link to="/login" className="text-gray-400 hover:text-gray-600">Volver a iniciar sesión</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
