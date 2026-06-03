import axios from 'axios';
import { getAuthKeys, getRealmFromPath, getLoginPath } from '../utils/authStorage.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const realm = config.authRealm ?? getRealmFromPath();
  if (realm) {
    const { token: tokenKey } = getAuthKeys(realm);
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const realm = error.config?.authRealm ?? getRealmFromPath();
    const hadToken = Boolean(error.config?.headers?.Authorization);

    if (status === 401 && hadToken && realm && !url.includes('/auth/')) {
      const keys = getAuthKeys(realm);
      localStorage.removeItem(keys.token);
      localStorage.removeItem(keys.user);
      localStorage.removeItem(keys.mustChangePassword);
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { realm } }));

      const loginPath = getLoginPath(realm);
      if (!window.location.pathname.startsWith(loginPath)) {
        window.location.href = loginPath;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
