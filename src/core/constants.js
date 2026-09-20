// Shared constants for the vault format. Changing these affects compatibility
// with existing vaults and backups, so bump FORMAT_VERSION if you do.
export const FORMAT_VERSION = 1;
export const KDF_NAME = 'PBKDF2-SHA256';
export const KDF_ITERATIONS = 600000; // OWASP guidance for PBKDF2-HMAC-SHA256
export const MIN_ITERATIONS = 100000; // refuse weaker settings found in a backup
export const MAX_ITERATIONS = 5000000; // refuse absurd values (denial of service)
export const SALT_BYTES = 16;
export const IV_BYTES = 12;
export const KEY_BYTES = 32; // AES-256
export const MIN_MASTER_LENGTH = 10;
