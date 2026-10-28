import { createClient } from 'npm:@supabase/supabase-js@2.51.0';
import { cifrar, descifrar, hashToken, nuevoToken } from './crypto.mjs';
import { validarCuenta, validarId, validarPago } from './validacion.mjs';

const ORIGINS = new Set(['https://e360.pro', 'https://www.e360.pro', 'http://localhost:5173', 'http://127.0.0.1:5173']);
const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ERRORS: Record<string, [number, string]> = {
  CONFLICTO_PAGO: [409, 'La cuenta cambió. Actualiza el listado antes de registrar el pago.'],
  FECHA_REQUERIDA: [422, 'Indica una próxima renovación futura para el período que pagaste.'],
  DESHACER_NO_DISPONIBLE: [409, 'Este pago ya no se puede deshacer. Actualiza el listado.'],
  DATOS_INVALIDOS: [400, 'Revisa los datos de la cuenta.'],
  ACCION_INVALIDA: [400, 'Operación no válida.'],
  SESION_INVALIDA: [401, 'Tu sesión ya no está activa. Vuelve a iniciar sesión.'],
  SOLO_ADMIN: [403, 'Esta sección solo está disponible para administradores.'],
  BOVEDA_BLOQUEADA: [423, 'Desbloquea las credenciales con tu contraseña del portal.'],
  CREDENCIALES_INVALIDAS: [401, 'La contraseña del portal no es correcta.'],
  LIMITE_INTENTOS: [429, 'Has alcanzado el límite de intentos. Espera quince minutos.'],
  CUENTA_NO_ENCONTRADA: [404, 'La cuenta ya no está disponible.'],
  SIN_CREDENCIAL: [404, 'Esta cuenta no tiene una contraseña guardada.'],
  CLAVE_NO_CONFIGURADA: [503, 'Las credenciales no están disponibles temporalmente.'],
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store, private',
    'Pragma': 'no-cache', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (origin && ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !ORIGINS.has(origin)) return respond(403, { error: 'Origen no permitido.' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return respond(405, { error: 'Método no permitido.' });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization = req.headers.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) throw new Error('SESION_INVALIDA');
    const jwt = authorization.slice(7);
    const auth = createClient(url, anon, { auth: authOptions });
    const { data: { user }, error: authError } = await auth.auth.getUser(jwt);
    if (authError || !user?.email) throw new Error('SESION_INVALIDA');
    let sessionId: string;
    try { sessionId = JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).session_id; }
    catch { throw new Error('SESION_INVALIDA'); }
    if (!UUID.test(sessionId)) throw new Error('SESION_INVALIDA');
    if (Number(req.headers.get('Content-Length')) > 32768) throw new Error('DATOS_INVALIDOS');
    const raw = await req.text();
    if (raw.length > 32768) throw new Error('DATOS_INVALIDOS');
    let body;
    try { body = JSON.parse(raw); } catch { throw new Error('DATOS_INVALIDOS'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('DATOS_INVALIDOS');
    const tokenHash = typeof body.desbloqueo === 'string' && /^[0-9a-f]{64}$/.test(body.desbloqueo)
      ? await hashToken(body.desbloqueo) : null;
    const service = createClient(url, serviceKey, { auth: authOptions });
    const rpc = async (action: string, data: Record<string, unknown> = {}, hash: string | null = tokenHash) => {
      const { data: result, error } = await service.rpc('tecnologia_operar', {
        p_accion: action, p_usuario: user.id, p_sesion: sessionId, p_token_hash: hash, p_datos: data,
      });
      if (error) throw new Error(error.message);
      return result;
    };
    await rpc('validar');

    if (body.accion === 'registrar_pago' || body.accion === 'deshacer_pago') {
      return respond(200, await rpc(body.accion, validarPago(body), null));
    }

    if (body.accion === 'desbloquear') {
      if (typeof body.contrasena !== 'string' || !body.contrasena || body.contrasena.length > 4096) throw new Error('DATOS_INVALIDOS');
      const { permitido } = await rpc('reservar_intento');
      if (!permitido) throw new Error('LIMITE_INTENTOS');
      // Isolated client: never signs the browser into a replacement session.
      const check = createClient(url, anon, { auth: authOptions });
      const { data, error } = await check.auth.signInWithPassword({ email: user.email, password: body.contrasena });
      body.contrasena = undefined;
      if (error || data.user?.id !== user.id || !data.session) {
        await rpc('fallo_desbloqueo');
        throw new Error('CREDENCIALES_INVALIDAS');
      }
      const { error: signOutError } = await check.auth.signOut({ scope: 'local' });
      if (signOutError) throw new Error('CLAVE_NO_CONFIGURADA');
      const token = nuevoToken();
      // Rechecks the original session; refuses if account policy invalidated it.
      await rpc('desbloquear', {}, await hashToken(token));
      return respond(200, { desbloqueo: token });
    }
    if (body.accion === 'bloquear') {
      await rpc('bloquear');
      return respond(200, { ok: true });
    }
    if (body.accion === 'revelar') {
      const id = validarId(body.id);
      const encrypted = await rpc('revelar', { id, motivo: body.motivo === 'copiar' ? 'copiar' : 'mostrar' });
      const key = Deno.env.get(`TECH_ACCOUNTS_KEY_V${encrypted.key_version}`);
      const contrasena = await descifrar(encrypted, id, key);
      return respond(200, { contrasena });
    }
    if (body.accion === 'guardar') {
      const cuenta = validarCuenta(body.cuenta);
      if (body.contrasena != null && (typeof body.contrasena !== 'string' || body.contrasena.length > 4096)) throw new Error('DATOS_INVALIDOS');
      if (body.eliminar_contrasena && body.contrasena) throw new Error('DATOS_INVALIDOS');
      const id = cuenta.nuevo ? (await rpc('siguiente_id')).id : cuenta.id;
      let encrypted = {};
      const modo = body.eliminar_contrasena === true ? 'eliminar' : body.contrasena ? 'guardar' : 'conservar';
      if (modo === 'guardar') encrypted = await cifrar(body.contrasena, id, Deno.env.get('TECH_ACCOUNTS_KEY_V1'));
      body.contrasena = undefined;
      const result = await rpc('guardar', { ...cuenta, id, ...encrypted, credencial_accion: modo });
      return respond(200, result);
    }
    if (body.accion === 'eliminar') {
      await rpc('eliminar', { id: validarId(body.id) });
      return respond(200, { ok: true });
    }
    throw new Error('ACCION_INVALIDA');
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const [status, message] = ERRORS[code] || [503, 'No se pudo completar la operación. Vuelve a intentar.'];
    // Do not log request bodies, Auth responses, credentials or tokens.
    return respond(status, { error: message, codigo: ERRORS[code] ? code : 'NO_DISPONIBLE' });
  }
});
