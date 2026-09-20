import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes as nodeRandom } from 'node:crypto';

import { b64encode, b64decode } from '../src/core/base64.js';
import { createVaultCrypto, validateRecord, VaultError } from '../src/core/vaultCrypto.js';
import * as web from '../src/platform/primitives.web.js';
import * as native from '../src/platform/primitives.js';
import { estimateStrength } from '../src/core/strength.js';
import { createGenerator } from '../src/core/generator.js';
import { auditVault } from '../src/core/audit.js';

const rnd = (n) => new Uint8Array(nodeRandom(n));
const webCrypto = createVaultCrypto({ ...web, randomBytes: rnd });
const nativeCrypto = createVaultCrypto({ ...native, randomBytes: rnd });
const FAST = 100000; // MIN_ITERATIONS: keeps the pure-JS tests quick
const sample = { entries: [{ id: 'a1', name: 'GitHub', username: 'me@x.com', password: 'S3cret!pass', notes: 'ünïcode ✓ 日本語' }] };

test('base64 round-trips every length and rejects garbage', () => {
  for (let n = 0; n < 40; n++) {
    const bytes = rnd(n);
    assert.deepEqual(b64decode(b64encode(bytes)), bytes);
    assert.equal(b64encode(bytes), Buffer.from(bytes).toString('base64'));
  }
  assert.throws(() => b64decode('not base64!!'));
  assert.throws(() => b64decode('A'));
});

test('create -> open round-trip (web crypto)', async () => {
  const { record } = await webCrypto.create('correct horse battery', sample, FAST);
  const { vault } = await webCrypto.open(record, 'correct horse battery');
  assert.deepEqual(vault, sample);
});

test('nothing sensitive appears in the stored record', async () => {
  const { record } = await webCrypto.create('pw-pw-pw-pw-pw', sample, FAST);
  const blob = JSON.stringify(record);
  for (const secret of ['GitHub', 'me@x.com', 'S3cret', 'ünïcode']) assert.ok(!blob.includes(secret));
});

test('wrong password is rejected with WRONG_PASSWORD', async () => {
  const { record } = await webCrypto.create('right-password-1', sample, FAST);
  await assert.rejects(() => webCrypto.open(record, 'wrong-password-1'), (e) => e instanceof VaultError && e.code === 'WRONG_PASSWORD');
  await assert.rejects(() => nativeCrypto.open(record, 'wrong-password-1'), (e) => e.code === 'WRONG_PASSWORD');
});

test('tampering with the ciphertext is detected (GCM auth tag)', async () => {
  const { record } = await webCrypto.create('right-password-1', sample, FAST);
  const bytes = b64decode(record.data);
  bytes[3] ^= 1;
  await assert.rejects(() => webCrypto.open({ ...record, data: b64encode(bytes) }, 'right-password-1'), (e) => e.code === 'WRONG_PASSWORD');
});

test('every save uses a fresh IV and a random salt per vault', async () => {
  const a = await webCrypto.create('pw-pw-pw-pw-pw', sample, FAST);
  const again = await webCrypto.seal(a.key, a.header, sample);
  assert.notEqual(a.record.iv, again.iv);
  assert.notEqual(a.record.data, again.data);
  const b = await webCrypto.create('pw-pw-pw-pw-pw', sample, FAST);
  assert.notEqual(a.record.salt, b.record.salt);
  // the key held in memory can decrypt a re-sealed record without re-deriving
  const { vault } = await webCrypto.open(again, 'pw-pw-pw-pw-pw');
  assert.deepEqual(vault, sample);
});

test('INTEROP: vault made with Web Crypto opens with native (@noble), and back', async () => {
  const w = await webCrypto.create('interop-password-!', sample, FAST);
  assert.deepEqual((await nativeCrypto.open(w.record, 'interop-password-!')).vault, sample);
  const n = await nativeCrypto.create('interop-password-!', sample, FAST);
  assert.deepEqual((await webCrypto.open(n.record, 'interop-password-!')).vault, sample);
});

test('INTEROP at the production 600,000 iterations', async () => {
  const t0 = Date.now();
  const n = await nativeCrypto.create('production-strength-pw', sample);
  const t1 = Date.now();
  const w = await webCrypto.open(n.record, 'production-strength-pw');
  const t2 = Date.now();
  assert.deepEqual(w.vault, sample);
  console.log(`   600k PBKDF2 in Node: noble(pure JS) ${t1 - t0} ms, Web Crypto ${t2 - t1} ms`);
});

test('same password typed in different Unicode forms derives the same key', async () => {
  const { record } = await webCrypto.create('caf\u00e9-password', sample, FAST); // precomposed é
  const { vault } = await webCrypto.open(record, 'cafe\u0301-password'); // e + combining accent
  assert.deepEqual(vault, sample);
});

test('validateRecord rejects malformed / hostile backups', async () => {
  const { record } = await webCrypto.create('pw-pw-pw-pw-pw', sample, FAST);
  assert.doesNotThrow(() => validateRecord(record));
  const bad = [
    null, 'x', {}, { ...record, v: 2 }, { ...record, kdf: 'md5' },
    { ...record, iterations: 1 }, { ...record, iterations: 1e12 }, { ...record, iterations: 'many' },
    { ...record, salt: '' }, { ...record, iv: b64encode(rnd(5)) }, { ...record, data: b64encode(rnd(4)) },
    { ...record, iv: '***' },
  ];
  for (const b of bad) assert.throws(() => validateRecord(b), (e) => e.code === 'INVALID_BACKUP', JSON.stringify(b)?.slice(0, 40));
});

test('strength estimator', () => {
  const s = (p) => estimateStrength(p).score;
  assert.equal(s(''), 0);
  assert.equal(s('password'), 0);
  assert.equal(s('Password123!'), 0);
  assert.equal(s('123456'), 0);
  assert.equal(s('aaaaaaaaaaaa'), 0);
  assert.equal(s('abcdefgh1234'), 0);
  assert.ok(s('tiger2020') <= 1);
  assert.ok(s('Summer2024') <= 1);
  assert.ok(s('MyDogRex1985') <= 1);
  assert.ok(s('Tr0ub4dor&3') >= 2);
  assert.ok(s('kQpXvNwZmLrTyBcD7') >= 3); // long random letters + a digit is NOT a word pattern
  assert.ok(s('Tr0ub4dor&3') >= 2);
  assert.equal(s('k9#Vm2$Lq8@Xz4!Wp7'), 4);
  assert.equal(s('correct horse battery staple'), 4);
});

test('generator: length, guaranteed classes, options, ambiguity, distribution', () => {
  const { generatePassword, randomInt } = createGenerator(rnd);
  for (let i = 0; i < 300; i++) {
    const p = generatePassword({ length: 12 });
    assert.equal(p.length, 12);
    assert.match(p, /[a-z]/); assert.match(p, /[A-Z]/); assert.match(p, /[0-9]/); assert.match(p, /[!@#$%^&*\-_=+?]/);
  }
  assert.match(generatePassword({ length: 30, upper: false, symbols: false, digits: false }), /^[a-z]{30}$/);
  assert.equal(generatePassword({ length: 1 }).length, 8); // clamped to min
  assert.equal(generatePassword({ length: 999 }).length, 64); // clamped to max
  assert.match(generatePassword({ lower: false, upper: false, digits: false, symbols: false }), /^[a-z]+$/); // never empty
  for (let i = 0; i < 200; i++) assert.doesNotMatch(generatePassword({ length: 40, avoidAmbiguous: true }), /[O0oIl1|]/);
  // rough uniformity of randomInt(7): every bucket within 15% of expectation
  const N = 70000; const buckets = new Array(7).fill(0);
  for (let i = 0; i < N; i++) buckets[randomInt(7)]++;
  for (const c of buckets) assert.ok(Math.abs(c - N / 7) < (N / 7) * 0.15, buckets.join());
});

test('audit finds weak, reused and old passwords', () => {
  const now = Date.now();
  const day = 86400000;
  const entries = [
    { id: '1', password: 'k9#Vm2$Lq8@Xz4!Wp7', passwordChangedAt: now - 5 * day },
    { id: '2', password: 'password', passwordChangedAt: now - 5 * day },
    { id: '3', password: 'Shared!Pass#99xyz', passwordChangedAt: now - 5 * day },
    { id: '4', password: 'Shared!Pass#99xyz', passwordChangedAt: now - 5 * day },
    { id: '5', password: 'q8$Zx1!mVw4#Lp0Rt', passwordChangedAt: now - 400 * day },
  ];
  const a = auditVault(entries, now);
  assert.deepEqual(a.issues, { 2: ['weak'], 3: ['reused'], 4: ['reused'], 5: ['old'] });
  assert.deepEqual(a.counts, { weak: 1, reused: 2, old: 1 });
  assert.equal(a.healthy, 1);
  assert.equal(auditVault([], now).total, 0);
});
