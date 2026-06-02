/**
 * Central API configuration — import from here, not VITE_API_URL directly.
 *
 * Priority:
 * 1. VITE_API_URL (Vercel env, optional override)
 * 2. PRODUCTION_API_URL when built for production (import.meta.env.PROD)
 * 3. Empty in dev → axios uses /api and Vite proxies to localhost:5000
 */

/** Your deployed backend (Render). Update if the URL changes. */
export const PRODUCTION_API_URL = 'https://osarthi.onrender.com';

function normalizeBase(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/$/, '');
}

/** Backend origin without trailing slash, e.g. https://osarthi.onrender.com */
export function getApiBaseUrl() {
  const fromEnv = normalizeBase(import.meta.env.VITE_API_URL);
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return normalizeBase(PRODUCTION_API_URL);
  return '';
}

/** Axios baseURL: full backend /api in prod, relative /api in dev */
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
