// Wires the platform-specific primitives into the shared, tested vault logic.
// Metro picks primitives.web.js / random.web.js in the browser and
// primitives.js / random.js on iOS + Android.
import { createVaultCrypto } from './core/vaultCrypto.js';
import { createGenerator } from './core/generator.js';
import { deriveKey, encrypt, decrypt, isCryptoAvailable } from './platform/primitives';
import { randomBytes } from './platform/random';

export const vaultCrypto = createVaultCrypto({ deriveKey, encrypt, decrypt, randomBytes });
export const { generatePassword } = createGenerator(randomBytes);
export { randomBytes, isCryptoAvailable };
