const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(256).fill(255);
for (let i = 0; i < CHARS.length; i++) LOOKUP[CHARS.charCodeAt(i)] = i;

export function b64encode(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += CHARS[a >> 2] + CHARS[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? CHARS[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < bytes.length ? CHARS[c & 63] : '=';
  }
  return out;
}

export function b64decode(input) {
  if (typeof input !== 'string') throw new Error('Invalid base64');
  const str = input.replace(/\s+/g, '').replace(/=+$/, '');
  if (str.length % 4 === 1) throw new Error('Invalid base64');
  const out = new Uint8Array(Math.floor((str.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < str.length; i += 4) {
    const vals = [0, 0, 0, 0];
    const n = Math.min(4, str.length - i);
    for (let j = 0; j < n; j++) {
      const v = LOOKUP[str.charCodeAt(i + j) & 255];
      if (v === 255 || str.charCodeAt(i + j) > 255) throw new Error('Invalid base64');
      vals[j] = v;
    }
    const triple = (vals[0] << 18) | (vals[1] << 12) | (vals[2] << 6) | vals[3];
    if (o < out.length) out[o++] = (triple >> 16) & 255;
    if (o < out.length) out[o++] = (triple >> 8) & 255;
    if (o < out.length) out[o++] = triple & 255;
  }
  return out;
}
