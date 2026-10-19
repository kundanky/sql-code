/**
 * End-to-End Encryption (E2EE) helper for SQL CODE Cloud Sync.
 * Uses AES-GCM 256-bit with PBKDF2 key derivation.
 */

export interface EncryptedSyncPayload {
  version: number;
  iv: string; // base64
  salt: string; // base64
  ciphertext: string; // base64
  clientTimestamp: string;
}

/**
 * Derives a key using WebCrypto or Node.js crypto
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an arbitrary object using AES-GCM
 */
export async function encryptPayload<T>(data: T, passphrase: string): Promise<EncryptedSyncPayload> {
  const enc = new TextEncoder();
  const serialized = JSON.stringify(data);
  const dataBytes = enc.encode(serialized);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    dataBytes
  );

  return {
    version: 1,
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
    clientTimestamp: new Date().toISOString()
  };
}

/**
 * Decrypts an encrypted payload with a passphrase
 */
export async function decryptPayload<T>(payload: EncryptedSyncPayload, passphrase: string): Promise<T> {
  const salt = Uint8Array.from(atob(payload.salt), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(payload.ciphertext), c => c.charCodeAt(0));

  const key = await deriveKey(passphrase, salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

/**
 * Sanitizes connection profile before syncing:
 * Strips out raw passwords unless explicitly encrypted.
 */
export function sanitizeConnectionForSync<T extends { password?: string; sshTunnel?: { password?: string; privateKey?: string } }>(conn: T): T {
  const cloned = JSON.parse(JSON.stringify(conn));
  if (cloned.password) {
    cloned.password = '***PROTECTED_CREDENTIAL***';
  }
  if (cloned.sshTunnel?.password) {
    cloned.sshTunnel.password = '***PROTECTED_CREDENTIAL***';
  }
  if (cloned.sshTunnel?.privateKey) {
    cloned.sshTunnel.privateKey = '***PROTECTED_PRIVATE_KEY***';
  }
  return cloned;
}
