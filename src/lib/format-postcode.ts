/**
 * Normalise a UK postcode so there is always exactly one space
 * between the outward code and the last 3 characters (inward code).
 * e.g. "SW1A1AA" → "SW1A 1AA", "sw1a 1aa" → "SW1A 1AA"
 */
export function formatPostcode(raw: string): string {
  const stripped = raw.replace(/\s+/g, "").toUpperCase();
  if (stripped.length < 4) return stripped;
  return `${stripped.slice(0, -3)} ${stripped.slice(-3)}`;
}

/**
 * Extract the UK postcode outward district (e.g. "CW2", "SW1A", "EC1A")
 * from any user input — works for full postcodes, partial postcodes,
 * or just the district itself.
 *
 * Examples:
 *   "CW2 6RW"  → "CW2"
 *   "cw26rw"   → "CW2"
 *   "CW2"      → "CW2"
 *   "SW1A 1AA" → "SW1A"
 *   "EC1A1BB"  → "EC1A"
 */
export function extractPostcodeDistrict(raw: string): string {
  const stripped = raw.replace(/\s+/g, "").toUpperCase();
  if (!stripped) return "";
  // If it looks like a full postcode (>= 5 chars), strip the inward code (last 3 chars)
  const outward = stripped.length >= 5 ? stripped.slice(0, -3) : stripped;
  // Match the standard UK outward district pattern: 1–2 letters, 1 digit, optional digit/letter
  const match = outward.match(/^[A-Z]{1,2}\d[A-Z\d]?/);
  return match ? match[0] : outward;
}
