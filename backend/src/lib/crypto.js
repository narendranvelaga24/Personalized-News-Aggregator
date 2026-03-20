const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

/**
 * Loads and validates the AES-256-GCM key from an environment variable.
 *
 * The key must be exactly 32 raw bytes. Store it base64-encoded in the env:
 *
 *   # Generate with:
 *   openssl rand -base64 32
 *   # or: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 *   # .env:
 *   FEEDBIN_ENCRYPTION_KEY=<44-character base64 string>
 *
 * The 44-character base64 string decodes to 32 bytes at runtime.
 * Do NOT use a literal 32-character ASCII string — ASCII chars are often
 * 1 byte each but restrict the key space and are mis-specified.
 *
 * @param {string} b64 - base64-encoded 32-byte key
 * @returns {Buffer} 32-byte Buffer
 * @throws {Error} if decoded length ≠ 32
 */
function loadKey(b64) {
  const buf = Buffer.from(b64, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      `FEEDBIN_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${buf.length}). ` +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return buf;
}

/**
 * Encrypts plaintext using AES-256-GCM.
 *
 * @param {string} plaintext
 * @param {string} keyB64 - base64-encoded 32-byte key (from env)
 * @returns {string} "iv:authTag:ciphertext" — all hex-encoded, colon-separated
 */
function encrypt(plaintext, keyB64) {
  const key = loadKey(keyB64);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a value previously encrypted with `encrypt`.
 *
 * @param {string} encryptedStr - "iv:authTag:ciphertext" hex string
 * @param {string} keyB64 - base64-encoded 32-byte key (from env)
 * @returns {string} plaintext
 */
function decrypt(encryptedStr, keyB64) {
  const [ivHex, authTagHex, ciphertext] = encryptedStr.split(':');
  const key = loadKey(keyB64);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt, loadKey };
