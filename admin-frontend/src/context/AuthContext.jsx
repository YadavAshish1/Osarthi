import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data?.user && ['admin', 'super_admin'].includes(data.user.role)) {
          setUser(data.user);
          setLoading(false);
          return;
        }

        // Try silent refresh from httpOnly cookie
        try {
          const { data: refreshData } = await api.post('/auth/refresh');
          if (refreshData?.user && ['admin', 'super_admin'].includes(refreshData.user.role)) {
            setUser(refreshData.user);
          }
        } catch {
          // No active session
        }
      } catch {
        // failed
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Background silent refresh every 10 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      api.post('/auth/refresh').catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const u = res.data?.user;
    if (!u || !['admin', 'super_admin'].includes(u.role)) {
      throw new Error('Access denied. Admin or Super Admin account required.');
    }
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password, role: 'admin' });
    const u = res.data?.user;
    setUser(u);
    return u;
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
