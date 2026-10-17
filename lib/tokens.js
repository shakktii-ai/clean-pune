import crypto from 'crypto';

/**
 * Generates an unguessable cryptographic tracking token.
 * Prevents enumeration attacks where sequential or predictable complaint IDs could leak private data.
 * Example: trk_a8f93c01b4e24177d8a9b6c0e812d45f
 */
export function generateTrackingToken() {
  const randomHex = crypto.randomBytes(16).toString('hex');
  return `trk_${randomHex}`;
}

/**
 * Generates a human-friendly public display reference.
 * Example: PUN-2026-7842
 */
export function generateDisplayId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PUN-${year}-${randomSuffix}`;
}
