/**
 * Central API configuration — import from here, not VITE_API_URL directly.
 *
 * It uses VITE_API_URL from .env file. If not set, it defaults to empty string
 * which makes axios use relative paths (handled by Vite proxy in dev).
 */

function normalizeBase(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/$/, '');
}

/** Backend origin without trailing slash */
export function getApiBaseUrl() {
  const fromEnv = normalizeBase(import.meta.env.VITE_API_URL);
  if (fromEnv) return fromEnv;
  return '';
}

/** Axios baseURL: full backend /api or relative /api */
export function getApiClientBaseUrl() {
  const base = getApiBaseUrl();
  return base ? `${base}/api` : '/api';
}

/** Full URL for fetch links and OAuth redirects */
export function getApiRoot(path = '') {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export function isApiConfigured() {
  return Boolean(getApiBaseUrl());
}
