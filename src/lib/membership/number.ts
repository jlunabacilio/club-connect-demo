import { randomInt } from "node:crypto";

// Crockford base32 alphabet — excludes I, L, O, U to avoid ambiguity when
// members read or type their number.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SUFFIX_LENGTH = 6;

/**
 * Generate a candidate membership number, e.g. "CC-2026-7Q4KZ2".
 *
 * Uniqueness is NOT guaranteed here — callers must persist it against a UNIQUE
 * constraint and retry on collision. With 32^6 (~1.07B) combinations per year,
 * collisions are rare and cheaply handled by a retry.
 */
export function generateMembershipNumber(now: Date = new Date()): string {
  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `CC-${now.getFullYear()}-${suffix}`;
}

/** Matches the format produced by {@link generateMembershipNumber}. */
export const MEMBERSHIP_NUMBER_RE = /^CC-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/;
