import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api/index.js';
import {
  readStoredUser,
  persistSession,
  clearSession,
  getAuthKeys,
} from '../utils/authStorage.js';

export function createAuthProvider(realm, expectedRole) {
  const AuthContext = createContext(null);

  function AuthProvider({ children }) {
    const [user, setUser] = useState(() => readStoredUser(realm));
    const [mustChangePassword, setMustChangePassword] = useState(() => {
      const keys = getAuthKeys(realm);
      return localStorage.getItem(keys.mustChangePassword) === 'true';
    });
    const [loading, setLoading] = useState(true);
    const sessionEpoch = useRef(0);

    const applySession = useCallback((data, epoch) => {
      if (epoch !== sessionEpoch.current) return;
      setUser(data.user);
      setMustChangePassword(!!data.mustChangePassword);
    }, []);

    const validateSession = useCallback(
      async (epoch) => {
        const keys = getAuthKeys(realm);
        const token = localStorage.getItem(keys.token);
        if (!token) {
          if (epoch === sessionEpoch.current) {
            setUser(null);
            setMustChangePassword(false);
            setLoading(false);
          }
          return;
        }

        try {
          const res = await authApi.me(realm);
          if (epoch !== sessionEpoch.current) return;

          const u = res.data.user;
          if (u.role !== expectedRole) {
            clearSession(realm);
            setUser(null);
            setMustChangePassword(false);
            return;
          }

          persistSession(realm, { token, user: u, mustChangePassword: u.mustChangePassword }, false);
          applySession({ user: u, mustChangePassword: u.mustChangePassword }, epoch);
        } catch {
          if (epoch !== sessionEpoch.current) return;
          clearSession(realm);
          setUser(null);
          setMustChangePassword(false);
        } finally {
          if (epoch === sessionEpoch.current) {
            setLoading(false);
          }
        }
      },
      [applySession]
    );

    useEffect(() => {
      const epoch = ++sessionEpoch.current;
      validateSession(epoch);

      function onAuthChanged(e) {
        if (e.detail?.realm && e.detail.realm !== realm) return;
        const epoch = ++sessionEpoch.current;
        setLoading(true);
        setUser(readStoredUser(realm));
        const keys = getAuthKeys(realm);
        setMustChangePassword(localStorage.getItem(keys.mustChangePassword) === 'true');
        validateSession(epoch);
      }

      function onStorage(e) {
        const keys = getAuthKeys(realm);
        if (e.key === keys.token || e.key === keys.user || e.key === keys.mustChangePassword) {
          onAuthChanged({ detail: { realm } });
        }
      }

      window.addEventListener('auth-changed', onAuthChanged);
      window.addEventListener('storage', onStorage);
      return () => {
        window.removeEventListener('auth-changed', onAuthChanged);
        window.removeEventListener('storage', onStorage);
      };
    }, [validateSession]);

    const login = useCallback(
      async (phone, password) => {
        const epoch = ++sessionEpoch.current;
        const res = await authApi.login(realm, phone, password);
        const { token, user: u, mustChangePassword: mcp } = res.data;

        if (u.role !== expectedRole) {
          throw new Error('Access denied for this portal');
        }

        persistSession(realm, { token, user: u, mustChangePassword: !!mcp }, true);
        applySession({ user: u, mustChangePassword: !!mcp }, epoch);
        setLoading(false);

        return { user: u, mustChangePassword: !!mcp };
      },
      [applySession]
    );

    const logout = useCallback(() => {
      ++sessionEpoch.current;
      clearSession(realm);
      setUser(null);
      setMustChangePassword(false);
      setLoading(false);
    }, []);

    const clearMustChangePassword = useCallback(() => {
      setMustChangePassword(false);
      const keys = getAuthKeys(realm);
      localStorage.setItem(keys.mustChangePassword, 'false');
      if (user) {
        const updated = { ...user, mustChangePassword: false };
        setUser(updated);
        localStorage.setItem(keys.user, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: { realm } }));
      }
    }, [user]);

    return (
      <AuthContext.Provider
        value={{
          user,
          loading,
          login,
          logout,
          mustChangePassword,
          clearMustChangePassword,
          realm,
          expectedRole,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error(`useAuth must be used within ${expectedRole} AuthProvider`);
    return ctx;
  }

  return { AuthProvider, useAuth, AuthContext };
}
