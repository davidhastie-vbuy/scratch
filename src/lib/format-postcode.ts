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
