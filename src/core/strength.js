// A quick, dependency-free strength estimate. It is a heuristic (not zxcvbn):
// it measures character variety and length, ignores repeats/sequences, and
// caps very common passwords. Good enough to nudge people away from weak ones.
const COMMON = new Set([
  'password', 'passw0rd', 'letmein', 'welcome', 'admin', 'administrator', 'login',
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'iloveyou', 'monkey',
  'dragon', 'football', 'baseball', 'master', 'sunshine', 'princess', 'shadow',
  'superman', 'batman', 'trustno1', 'abc123', 'changeme', 'default', 'secret',
  'hello', 'freedom', 'whatever', 'starwars', 'pokemon', 'michael', 'jordan',
  'charlie', 'donald', 'cricket', 'india', 'india123', 'test', 'testing', 'guest',
]);

export const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent'];

function poolSize(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[ -/:-@[-`{-~]/.test(pw)) pool += 33;
  if (/[^\x00-\x7f]/.test(pw)) pool += 100;
  return pool;
}

// Count only characters that add information: skip repeats ("aaaa") and
// straight runs ("abcd", "1234", "4321").
function effectiveLength(pw) {
  let n = 0;
  for (let i = 0; i < pw.length; i++) {
    if (i === 0) { n++; continue; }
    const d = pw.charCodeAt(i) - pw.charCodeAt(i - 1);
    if (d === 0) continue;
    if ((d === 1 || d === -1) && i > 1 && pw.charCodeAt(i - 1) - pw.charCodeAt(i - 2) === d) continue;
    n++;
  }
  return n;
}

export function estimateStrength(pw) {
  if (!pw) return { score: 0, bits: 0, label: STRENGTH_LABELS[0] };
  const pool = poolSize(pw);
  let bits = effectiveLength(pw) * Math.log2(Math.max(pool, 2));

  // Peel typical decoration (Capital first letter, trailing digits/symbols) before
  // checking the common-password list, so "Password123!" is caught too.
  const core = pw.toLowerCase().replace(/[\d\W_]+$/g, '').replace(/^[\d\W_]+/g, '');
  const leet = core.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/@/g, 'a').replace(/\$/g, 's');
  if (COMMON.has(core) || COMMON.has(leet) || COMMON.has(pw.toLowerCase())) bits = Math.min(bits, 12);
  if (/^\d+$/.test(pw)) bits = Math.min(bits, pw.length * 3.3);
  // "Summer2024", "MyDogRex1985!": a few plain words followed by a number is by far
  // the most common weak pattern, and attackers try it first.
  const wordsAndNumber = pw.match(/^((?:[A-Z]?[a-z]+)+)\d{1,4}[\W_]{0,2}$/);
  if (wordsAndNumber) {
    const letters = wordsAndNumber[1];
    const words = letters.match(/[A-Z]?[a-z]+/g).length;
    // avg word length >= 2 keeps random strings like "kQpXvNw1" out of this rule
    if (letters.length <= 16 && words <= 4 && letters.length / words >= 2) bits = Math.min(bits, 40);
  }

  bits = Math.round(bits);
  const score = bits < 30 ? 0 : bits < 45 ? 1 : bits < 65 ? 2 : bits < 90 ? 3 : 4;
  return { score, bits, label: STRENGTH_LABELS[score] };
}
