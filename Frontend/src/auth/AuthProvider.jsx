import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAccessToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // try to refresh token on mount (refresh token stored in httpOnly cookie)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.post("/auth/refresh");
        const data = resp?.data;
        if (data?.token && mounted) {
          setToken(data.token);
          setUser(data.user || null);
          setAccessToken(data.token);
        }
      } catch (e) {
        // no cookie-based refresh available
      } finally {
        // mark that initial auth check finished (so routes can render)
        if (mounted) setInitialized(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setAccessToken(token);
  }, [token]);

  async function login(email, password) {
    try {
      const resp = await api.post("/auth/login", { email, password });
      const data = resp?.data;
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || { email });
        return { ok: true };
      }
    } catch (e) {
      return { ok: false, error: e?.response?.data || e.message || 'login failed' };
    }
    return { ok: false, error: 'no token returned' };
  }

  async function register(email, password, name) {
    try {
      const resp = await api.post("/auth/register", { email, password, name });
      const data = resp?.data;
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || { email });
        return { ok: true };
      }
    } catch (e) {
      return { ok: false, error: e?.response?.data || e.message || 'register failed' };
    }
    return { ok: false, error: 'no token returned' };
  }

  function logout() {
    setToken(null);
    setUser(null);
    try {
      // notify server to clear refresh cookie
      api.post("/auth/logout").catch(() => {});
    } catch (e) {}
  }

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
