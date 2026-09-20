export function randomBytes(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}
