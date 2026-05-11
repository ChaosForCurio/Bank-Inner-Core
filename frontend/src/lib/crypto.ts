/**
 * E2EE Crypto Utilities for Sovereign Banking
 * Uses Web Crypto API for browser-side encryption
 */

/**
 * Derives a cryptographic key from a user-provided secret or passkey
 */
export async function deriveKey(secret: string, salt: string = 'xieriee-sovereign-salt'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a message using AES-GCM
 */
export async function encryptNote(message: string, key: CryptoKey): Promise<{ encryptedData: string, iv: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(message)
  );

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

/**
 * Decrypts a message using AES-GCM
 */
export async function decryptNote(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
  const dec = new TextDecoder();
  const dataBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      dataBuffer
    );
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Decryption Failed: Invalid Key]';
  }
}

/**
 * Get the default encryption secret from local storage or prompt
 * In a real app, this might be derived from a hardware security key or passkey
 */
export const getEncryptionSecret = () => {
  if (typeof window === 'undefined') return 'default-secret';
  let secret = localStorage.getItem('xieriee_encryption_secret');
  if (!secret) {
    // For demo purposes, we set a default, but real users would set their own
    secret = 'sovereign-vault-key-2024';
    localStorage.setItem('xieriee_encryption_secret', secret);
  }
  return secret;
};
