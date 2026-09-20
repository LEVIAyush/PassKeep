import { MIN_MASTER_LENGTH } from './constants.js';
import { estimateStrength } from './strength.js';

/** Returns an error message, or '' when the master password is acceptable. */
export function checkMasterPassword(pw) {
  if (pw.length < MIN_MASTER_LENGTH) return `Use at least ${MIN_MASTER_LENGTH} characters.`;
  if (estimateStrength(pw).score < 2) return 'Too easy to guess. Add more words, numbers or symbols.';
  return '';
}
