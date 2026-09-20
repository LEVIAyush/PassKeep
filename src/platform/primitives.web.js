// Browser implementation: the native Web Crypto API (fast, and the derived key
// is created non-extractable so page scripts can never read the raw key bytes).
const subtle = globalThis.crypto && globalThis.crypto.subtle;
const enc = new TextEncoder();

export const isCryptoAvailable = () => !!subtle;

export async function deriveKey(password, salt, iterations) {
  const base = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(key, iv, bytes) {
  return new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
}

export async function decrypt(key, iv, bytes) {
  return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv }, key, bytes));
}
