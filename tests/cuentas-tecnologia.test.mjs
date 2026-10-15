import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { crearEstadoAuth, idSesion } from '../src/lib/authStore.mjs';
import { cifrar, descifrar, hashToken, nuevoToken } from '../supabase/functions/cuentas-tecnologia/crypto.mjs';
import { validarCuenta } from '../supabase/functions/cuentas-tecnologia/validacion.mjs';

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));
const session = (id = 'u1', sid = 's1') => ({ user: { id }, access_token: `header.${btoa(JSON.stringify({ session_id: sid }))}.sig` });
function fakeAuth() {
  let callback;
  let calls = 0;
  let handler = async () => ({ data: { rol: 'admin' }, error: null });
  const client = {
    auth: {
      getSession: async () => ({ data: { session: session() } }),
      onAuthStateChange: (fn) => { callback = fn; return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => { calls++; return handler(); } }) }) }),
  };
  return { client, emit: (event, value = session()) => callback(event, value), count: () => calls, handle: (fn) => { handler = fn; } };
}

test('same-session SIGNED_IN and JWT refresh preserve mounted access and share role lookup', async () => {
  const fake = fakeAuth(); const store = crearEstadoAuth(fake.client);
  const stop = store.start(); const stop2 = store.start();
  await flush();
  assert.equal(store.getSnapshot().rol, 'admin'); assert.equal(fake.count(), 1);
  const states = [];
  const unsubscribe = store.subscribe(() => states.push(store.getSnapshot()));
  for (let i = 0; i < 5; i++) fake.emit('SIGNED_IN');
  fake.emit('TOKEN_REFRESHED'); await flush();
  assert.equal(fake.count(), 1);
  assert.ok(states.every((s) => !s.loading && s.rol === 'admin'));
  assert.equal(idSesion(store.getSnapshot().session), 's1');
  unsubscribe(); stop(); stop2();
});

test('temporary role-query error preserves prior access, role withdrawal and signout clear it', async () => {
  const fake = fakeAuth(); const store = crearEstadoAuth(fake.client); const stop = store.start(); await flush();
  fake.handle(async () => ({ data: null, error: { message: 'network' } }));
  await store.retry();
  assert.equal(store.getSnapshot().rol, 'admin'); assert.equal(store.getSnapshot().loading, false);
  assert.ok(store.getSnapshot().error);
  fake.handle(async () => ({ data: { rol: 'auditor' }, error: null })); await store.retry();
  assert.equal(store.getSnapshot().rol, 'auditor');
  fake.emit('SIGNED_OUT', null);
  assert.equal(store.getSnapshot().user, null); assert.equal(store.getSnapshot().rol, null);
  stop();
});

test('a late role response from a previous identity cannot restore its access', async () => {
  const fake = fakeAuth(); let complete;
  fake.handle(() => new Promise((resolve) => { complete = resolve; }));
  const store = crearEstadoAuth(fake.client); const stop = store.start(); await flush();
  fake.emit('SIGNED_OUT', null);
  complete({ data: { rol: 'admin' }, error: null }); await flush();
  assert.equal(store.getSnapshot().rol, null); assert.equal(store.getSnapshot().user, null); stop();
});

test('authenticated encryption roundtrip, unique IV and tampering/account binding', async () => {
  const key = randomBytes(32).toString('base64');
  const value = 'Prueba únicamente ñ! 🔒';
  const one = await cifrar(value, 14, key); const two = await cifrar(value, 14, key);
  assert.equal(await descifrar(one, 14, key), value);
  assert.notEqual(one.iv, two.iv); assert.notEqual(one.ciphertext, two.ciphertext);
  assert.ok(!JSON.stringify(one).includes(value));
  await assert.rejects(descifrar(one, 15, key));
  await assert.rejects(descifrar(one, 14, randomBytes(32).toString('base64')));
  const broken = Buffer.from(one.ciphertext, 'base64'); broken[0] ^= 1;
  await assert.rejects(descifrar({ ...one, ciphertext: broken.toString('base64') }, 14, key));
  await assert.rejects(cifrar(value, 14, undefined));
  const token = nuevoToken(); assert.match(token, /^[a-f0-9]{64}$/); assert.notEqual(await hashToken(token), token);
});

test('account validation preserves full calendar dates and cannot pass secrets into metadata', () => {
  const input = { herramienta: 'Claude', plan: 'Pro', correo: 'test@example.com', uso: 'Investigación', fecha_renovacion: '2028-02-29', costo: '20', moneda: 'USD', contrasena: 'no-store' };
  assert.equal(validarCuenta(input).fecha_renovacion, '2028-02-29');
  assert.equal(validarCuenta(input).contrasena, undefined);
  for (const moneda of ['MXN', 'COP', 'USD', 'EUR']) assert.equal(validarCuenta({ ...input, moneda }).moneda, moneda);
  assert.throws(() => validarCuenta({ ...input, moneda: 'XXX' }));
  for (const fecha_renovacion of ['2026-02-29', '2026-13-01', '2026-01-32', '14/10/2026']) assert.throws(() => validarCuenta({ ...input, fecha_renovacion }));
  assert.throws(() => validarCuenta({ ...input, fecha_renovacion: '' }));
  assert.throws(() => validarCuenta({ ...input, costo: -1 }));
  assert.throws(() => validarCuenta({ ...input, correo: 'sin-correo' }));
  assert.equal(validarCuenta({ ...input, id: 1, correo: '', uso: '', fecha_renovacion: '' }).fecha_renovacion, null);
});
