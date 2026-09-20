// Cryptographically secure password generator. Takes the platform's
// randomBytes so it works on web and native.
const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*-_=+?',
};
const AMBIGUOUS = /[O0oIl1|]/g;

export const DEFAULT_OPTIONS = { length: 20, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false };
export const MIN_LENGTH = 8;
export const MAX_LENGTH = 64;

export function createGenerator(randomBytes) {
  // Uniform integer in [0, max) using rejection sampling (no modulo bias).
  function randomInt(max) {
    const limit = 0x100000000 - (0x100000000 % max);
    for (;;) {
      const b = randomBytes(4);
      const n = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
      if (n < limit) return n % max;
    }
  }

  function generatePassword(options = {}) {
    const o = { ...DEFAULT_OPTIONS, ...options };
    const length = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(o.length)));
    const pools = ['lower', 'upper', 'digits', 'symbols']
      .filter((k) => o[k])
      .map((k) => (o.avoidAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]))
      .filter(Boolean);
    if (pools.length === 0) pools.push(SETS.lower); // never return an empty alphabet
    const all = pools.join('');

    // Guarantee at least one character from every selected set...
    const chars = pools.map((p) => p[randomInt(p.length)]);
    while (chars.length < length) chars.push(all[randomInt(all.length)]);
    // ...then shuffle (Fisher-Yates) so those aren't always at the front.
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  return { generatePassword, randomInt };
}
