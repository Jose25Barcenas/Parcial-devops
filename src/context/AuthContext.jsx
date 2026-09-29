import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';
import { getStoredToken, getStoredUser, clearSession, storeSession } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!getStoredToken());

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    async function boot() {
      try {
        const me = await authService.me();
        if (cancelled) return;
        if (!me || !me.email) throw new Error('Perfil invalido');
        setUser(me);
        const remembered = (() => {
          try { return !!localStorage.getItem('token'); } catch { return true; }
        })();
        storeSession(token, me, remembered);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401 || err.status === 403) {
          clearSession();
          setToken(null);
          setUser(null);
        } else {
          const stored = getStoredUser();
          try {
            setUser(stored ? JSON.parse(stored) : null);
          } catch {
            clearSession();
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => { cancelled = true; };
  }, [token]);

  const login = async (email, password, remember = true) => {
    const res = await authService.login(email, password);
    if (!res || !res.token || !res.user) {
      throw new Error('Respuesta invalida del servidor');
    }
    storeSession(res.token, res.user, remember);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    return res;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
