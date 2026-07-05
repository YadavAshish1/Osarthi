import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRole, setPendingRole] = useState(
    () => sessionStorage.getItem('osarthi_pending_role') || null
  );

  const loadUser = useCallback(async () => {
    try {
      const token = getAccessToken();

      if (token) {
        try {
          // Access token present hai — verify karo /auth/me se
          const res = await api.get('/auth/me');
          if (res.data.user) {
            setUser(res.data.user);
            return;
          }
        } catch (err) {
          // Access token expire ho gaya (401) — refresh try karo
          if (err.response?.status !== 401) throw err;
          setAccessToken(null);
        }
      }

      // Access token nahi hai ya expire hua — refresh token se naya access token lo
      try {
        const refresh = await api.post('/auth/refresh');
        setAccessToken(refresh.data.accessToken);
        setUser(refresh.data.user);
      } catch {
        // Refresh token bhi nahi / expire — user ko logout karo
        setAccessToken(null);
        setUser(null);
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // App open hone par auto-login try karo
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Jab refresh token expire ho jaye (mid-session), user ko logout karo
  useEffect(() => {
    const handleForceLogout = () => {
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const selectRole = (role) => {
    sessionStorage.setItem('osarthi_pending_role', role);
    setPendingRole(role);
  };

  const clearPendingRole = () => {
    sessionStorage.removeItem('osarthi_pending_role');
    setPendingRole(null);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    clearPendingRole();
    return res.data.user;
  };

  const oauthRegister = async (data) => {
    const res = await api.post('/auth/oauth-register', data);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    clearPendingRole();
    return res.data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
  };

  const completeOAuth = async (token) => {
    setAccessToken(token);
    await loadUser();
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingRole,
        selectRole,
        clearPendingRole,
        login,
        register,
        oauthRegister,
        logout,
        completeOAuth,
        refreshUser: loadUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
