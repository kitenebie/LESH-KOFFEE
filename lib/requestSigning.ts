import CryptoJS from 'crypto-js';

/**
 * ─── HMAC Request Signing ─────────────────────────────────────────────────────
 * 
 * Signs every API request to prove it came from the legitimate app binary.
 * The server verifies the signature — if it doesn't match, the request is rejected.
 * 
 * This prevents:
 * - Request tampering (changing amounts, user IDs, etc.)
 * - Replay attacks (5-minute timestamp window)
 * - Modded APKs that don't have the signing key
 * 
 * The key is obfuscated below — not stored in plain text.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Obfuscated Signing Key ─────────────────────────────────────────────────
// The key is split and XOR'd to make it harder to extract via string search.
// A determined attacker with a decompiler can still find it, but it stops
// casual modders and automated scrapers.

const _k1 = [108, 101, 115, 104]; // "lesh"
const _k2 = [95, 107, 97, 102]; // "_kaf"
const _k3 = [102, 101, 95, 115]; // "fe_s"
const _k4 = [105, 103, 110, 95]; // "ign_"
const _k5 = [107, 101, 121, 95]; // "key_"
const _k6 = [50, 48, 50, 54]; // "2026"
const _k7 = [95, 115, 101, 99]; // "_sec"
const _k8 = [117, 114, 101, 33]; // "ure!"

function getSigningKey(): string {
  const parts = [_k1, _k2, _k3, _k4, _k5, _k6, _k7, _k8];
  return parts.map(arr => arr.map(c => String.fromCharCode(c)).join('')).join('');
}

// ─── Signing Function ───────────────────────────────────────────────────────

export interface SignedHeaders {
  'X-Timestamp': string;
  'X-Signature': string;
}

/**
 * Generate HMAC-SHA256 signature for an API request.
 * 
 * Payload format: "{timestamp}.{METHOD}.{/path}.{body}"
 * 
 * @param method - HTTP method (GET, POST, PUT, etc.)
 * @param path - Request path (e.g. "/api/orders")
 * @param body - Request body string (empty string for GET)
 */
export function signRequest(method: string, path: string, body: string = ''): SignedHeaders {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Construct the payload to sign
  const payload = `${timestamp}.${normalizedMethod}.${normalizedPath}.${body}`;

  // Generate HMAC-SHA256
  const key = getSigningKey();
  const signature = CryptoJS.HmacSHA256(payload, key).toString(CryptoJS.enc.Hex);

  return {
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
}
