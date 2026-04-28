/**
 * Collision-resistant id generator (cuid2-style without the dep).
 *
 * 24 chars, URL-safe, lexicographically sortable on creation time.
 * Format: <8 chars timestamp base36><16 chars random base36>
 *
 * Good enough for primary keys at our scale; switch to @paralleldrive/cuid2
 * if we ever need cryptographic guarantees.
 */

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomBase36(length: number): string {
  let out = "";
  // Use crypto.getRandomValues when available; falls back to Math.random in
  // edge runtimes that haven't polyfilled it (none of ours, but safe default).
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function createId(): string {
  const ts = Date.now().toString(36).padStart(8, "0");
  return ts + randomBase36(16);
}
