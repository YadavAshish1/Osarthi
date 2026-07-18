import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => {
        if (res.data?.user?.role === 'admin') {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('adminToken');
        }
      })
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: u } = res.data;
    if (u.role !== 'admin') throw new Error('Access denied. Admin account required.');
    localStorage.setItem('adminToken', accessToken);
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password, role: 'admin' });
    const { accessToken, user: u } = res.data;
    localStorage.setItem('adminToken', accessToken);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
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
