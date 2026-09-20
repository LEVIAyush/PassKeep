// One-time migration from PassKeep 1.x. That version stored passwords in
// localStorage under the key "passwords", "encrypted" with a key that was
// hard-coded in the app source (so effectively readable by anyone). We decrypt
// them with that old key once and move them into the new, properly protected vault.
import CryptoJS from 'crypto-js';

const LEGACY_STORAGE_KEY = 'passwords';
const LEGACY_KEY = 'your-secret-key-123';

export function readLegacy() {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return { entries: [], rawCount: 0 };
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return { entries: [], rawCount: 0 };
    const entries = [];
    for (const item of list) {
      try {
        const password = CryptoJS.AES.decrypt(item.password, LEGACY_KEY).toString(CryptoJS.enc.Utf8);
        if (!password) continue;
        const parsed = Date.parse(item.timestamp);
        entries.push({
          category: item.category === 'app' ? 'app' : 'browser',
          name: String(item.website || 'Untitled'),
          username: String(item.username || ''),
          password,
          createdAt: Number.isNaN(parsed) ? Date.now() : parsed,
        });
      } catch {
        /* skip a record that can't be decrypted */
      }
    }
    return { entries, rawCount: list.length };
  } catch {
    return { entries: [], rawCount: 0 };
  }
}

export function clearLegacy() {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
