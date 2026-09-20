import { getRandomBytes } from 'expo-crypto';

export function randomBytes(n) {
  return getRandomBytes(n);
}
