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
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setLoading(false);
        return;
      }
      try {
        const refresh = await api.post('/auth/refresh');
        setAccessToken(refresh.data.accessToken);
        setUser(refresh.data.user);
      } catch {
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

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
