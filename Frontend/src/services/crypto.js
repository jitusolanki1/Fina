// basic AES-256-CBC encryption using Web Crypto API
// Expects VITE_ENCRYPTION_KEY to be defined at build time (not secure for real secrets)

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKeyFromPassphrase(pass) {
  const salt = encoder.encode('fina-salt');
  const pw = await crypto.subtle.importKey('raw', encoder.encode(pass), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, pw, { name: 'AES-CBC', length: 256 }, true, ['encrypt', 'decrypt']);
  return key;
}

export async function encryptString(str, passphrase) {
  const key = await getKeyFromPassphrase(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const ct = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, encoder.encode(str));
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

// Not used on client, but available
export async function decryptString(base64, passphrase) {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = raw.slice(0, 16);
  const ct = raw.slice(16);
  const key = await getKeyFromPassphrase(passphrase);
  const pt = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, ct);
  return decoder.decode(pt);
}
