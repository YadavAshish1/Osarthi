import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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
      refreshPromise = api
        .post('/auth/refresh')
        .then((res) => {
          const newToken = res.data?.accessToken;
          if (newToken) {
            localStorage.setItem('adminToken', newToken);
            return newToken;
          }
          return null;
        })
        .catch(() => {
          // Refresh token expired (after 7 days) or invalid — trigger logout
          localStorage.removeItem('adminToken');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
);
