// Native (iOS/Android) implementation: audited pure-JS primitives from @noble.
// Produces byte-for-byte the same format as primitives.web.js, so a backup made
// on the web opens on a phone and vice versa. PBKDF2 yields to the UI thread
// periodically so the app doesn't freeze while unlocking.
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { gcm } from '@noble/ciphers/aes.js';

const enc = new TextEncoder();

export const isCryptoAvailable = () => true;

export async function deriveKey(password, salt, iterations) {
  return pbkdf2Async(sha256, enc.encode(password), salt, { c: iterations, dkLen: 32, asyncTick: 10 });
}

export async function encrypt(key, iv, bytes) {
  return gcm(key, iv).encrypt(bytes);
}

export async function decrypt(key, iv, bytes) {
  return gcm(key, iv).decrypt(bytes);
}
