import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://osarthi.onrender.com';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem('osarthi_access', token);
  else localStorage.removeItem('osarthi_access');
}

export function getAccessToken() {
  if (!accessToken) accessToken = localStorage.getItem('osarthi_access');
  return accessToken;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_SKIP_REFRESH = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/oauth-register'];

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
          setAccessToken(res.data.accessToken);
          return res.data.accessToken;
        })
        .catch(() => {
          setAccessToken(null);
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
