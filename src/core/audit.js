import { estimateStrength } from './strength.js';

export const OLD_AFTER_DAYS = 180;
const DAY = 86400000;

/**
 * Looks through the vault for passwords that deserve attention.
 * Runs entirely in memory on already-decrypted entries.
 */
export function auditVault(entries, now = Date.now()) {
  const byPassword = new Map();
  for (const e of entries) {
    if (!e.password) continue;
    byPassword.set(e.password, (byPassword.get(e.password) || 0) + 1);
  }

  const issues = {}; // id -> ['weak' | 'reused' | 'old']
  const counts = { weak: 0, reused: 0, old: 0 };
  for (const e of entries) {
    const found = [];
    if (estimateStrength(e.password).score <= 1) found.push('weak');
    if (e.password && byPassword.get(e.password) > 1) found.push('reused');
    const changed = e.passwordChangedAt || e.updatedAt || e.createdAt || now;
    if (now - changed > OLD_AFTER_DAYS * DAY) found.push('old');
    if (found.length) {
      issues[e.id] = found;
      found.forEach((k) => { counts[k] += 1; });
    }
  }
  const flagged = Object.keys(issues).length;
  return { issues, counts, flagged, healthy: entries.length - flagged, total: entries.length };
}
