import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-auth-portal': 'admin',
  },
});

let refreshPromise = null;
const AUTH_SKIP_REFRESH = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/send-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
];

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
      refreshPromise = api
        .post('/auth/refresh')
        .then((res) => {
          return res.data?.user || true;
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
          return null;
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

