/**
 * Returns the base site URL, preferring the environment variable.
 * Falls back to window.location.origin at runtime.
 */
export function getSiteUrl(): string {
  // VITE_SITE_URL is set at build time; use it if available.
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }
  // Fallback for local development
  return typeof window !== 'undefined' ? window.location.origin : 'https://bookatrade.io';
}
