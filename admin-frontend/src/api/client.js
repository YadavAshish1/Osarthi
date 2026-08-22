import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// axios instance — relies 100% on secure httpOnly cookies with credentials
export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise = null;
const AUTH_SKIP_REFRESH = ['/auth/refresh', '/auth/login', '/auth/register'];

// Automatic 401 Interceptor — Silently refreshes access token using httpOnly refreshToken cookie
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const url = original.url || '';

    if (AUTH_SKIP_REFRESH.some((path) => url.includes(path))) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = axios
        .post(
          `${BASE}/api/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
        )
        .then((res) => {
          return res.status === 200;
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
          return false;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const refreshed = await refreshPromise;
    if (!refreshed) return Promise.reject(error);

    return api(original);
  }
);
