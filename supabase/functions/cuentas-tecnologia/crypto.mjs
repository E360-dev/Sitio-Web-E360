const encoder = new TextEncoder();
const bytes = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
const base64 = (value) => btoa(String.fromCharCode(...new Uint8Array(value)));
const aad = (id, version) => encoder.encode(`cuentas-tecnologia:${id}:v${version}`);

export async function claveCifrado(secret) {
  if (!secret) throw new Error('CLAVE_NO_CONFIGURADA');
  const raw = bytes(secret);
  if (raw.length !== 32) throw new Error('CLAVE_NO_CONFIGURADA');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function cifrar(contrasena, id, secret, version = 1) {
  const key = await claveCifrado(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(id, version), tagLength: 128 }, key, encoder.encode(contrasena));
  return { ciphertext: base64(ciphertext), iv: base64(iv), key_version: version };
}

export async function descifrar(encrypted, id, secret) {
  const key = await claveCifrado(secret);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(encrypted.iv), additionalData: aad(id, encrypted.key_version), tagLength: 128 }, key, bytes(encrypted.ciphertext));
  return new TextDecoder().decode(plaintext);
}

export function nuevoToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
