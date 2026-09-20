// The whole vault (every field of every entry) is serialised to JSON and
// encrypted as ONE AES-256-GCM blob. The key comes from the master password via
// PBKDF2-SHA256 with a random per-vault salt. Nothing is stored in plaintext and
// there is no key baked into the app. A wrong password is detected because the
// GCM authentication tag fails to verify.
//
// The platform-specific primitives (Web Crypto in browsers, @noble on native)
// are injected so the exact same format is produced everywhere and can be
// tested against each other.
import { b64encode, b64decode } from './base64.js';
import {
  FORMAT_VERSION, KDF_NAME, KDF_ITERATIONS, MIN_ITERATIONS, MAX_ITERATIONS,
  SALT_BYTES, IV_BYTES,
} from './constants.js';

export class VaultError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'VaultError';
    this.code = code; // 'WRONG_PASSWORD' | 'INVALID_BACKUP'
  }
}

const invalid = (msg) => new VaultError('INVALID_BACKUP', msg);

export function validateRecord(r) {
  if (!r || typeof r !== 'object') throw invalid('This is not a PassKeep vault.');
  if (r.v !== FORMAT_VERSION) throw invalid('This vault was made by an unsupported version.');
  if (r.kdf !== KDF_NAME) throw invalid('Unsupported key derivation method.');
  if (!Number.isInteger(r.iterations) || r.iterations < MIN_ITERATIONS || r.iterations > MAX_ITERATIONS) {
    throw invalid('Vault key-derivation settings are out of the accepted range.');
  }
  for (const f of ['salt', 'iv', 'data']) {
    if (typeof r[f] !== 'string' || !r[f]) throw invalid('Vault file is missing data.');
  }
  try {
    if (b64decode(r.salt).length < 8 || b64decode(r.iv).length !== IV_BYTES || b64decode(r.data).length < 16) {
      throw new Error('bad length');
    }
  } catch {
    throw invalid('Vault file is corrupted.');
  }
  return {
    v: r.v, kdf: r.kdf, iterations: r.iterations, salt: r.salt, iv: r.iv, data: r.data,
  };
}

export function createVaultCrypto({ deriveKey, encrypt, decrypt, randomBytes }) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  // NFKC so the same password typed on different keyboards/platforms derives the same key.
  const norm = (pw) => String(pw).normalize('NFKC');

  async function seal(key, header, vault) {
    const iv = randomBytes(IV_BYTES); // fresh IV on every save
    const ct = await encrypt(key, iv, enc.encode(JSON.stringify(vault)));
    return { ...header, iv: b64encode(iv), data: b64encode(ct) };
  }

  async function decryptRecord(key, record) {
    let plain;
    try {
      plain = await decrypt(key, b64decode(record.iv), b64decode(record.data));
    } catch {
      throw new VaultError('WRONG_PASSWORD', 'Wrong master password.');
    }
    let vault;
    try {
      vault = JSON.parse(dec.decode(plain));
    } catch {
      throw invalid('Vault contents are corrupted.');
    }
    if (!vault || !Array.isArray(vault.entries)) throw invalid('Vault contents are corrupted.');
    return vault;
  }

  return {
    /** Create a brand-new vault protected by `password`. */
    async create(password, vault, iterations = KDF_ITERATIONS) {
      const salt = randomBytes(SALT_BYTES);
      const key = await deriveKey(norm(password), salt, iterations);
      const header = { v: FORMAT_VERSION, kdf: KDF_NAME, iterations, salt: b64encode(salt) };
      return { key, header, record: await seal(key, header, vault) };
    },

    /** Decrypt a stored record. Throws VaultError('WRONG_PASSWORD') on a bad password. */
    async open(record, password) {
      const clean = validateRecord(record);
      const key = await deriveKey(norm(password), b64decode(clean.salt), clean.iterations);
      const vault = await decryptRecord(key, clean);
      const { iv, data, ...header } = clean;
      return { key, header, vault };
    },

    /** Re-encrypt with the key we already hold (used after every edit). */
    seal,
  };
}
