import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchJson, setAccessToken } from "../fetchClient";

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
        const data = await fetchJson('/auth/refresh', { method: 'POST' });
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
      const data = await fetchJson('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || { username: email });
        try { if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken); } catch (e) {}
        return { ok: true };
      }
    } catch (e) {
      // Normalize error body to a string to avoid passing objects into UI
      const body = e && e.body;
      const msg =
        (body && (typeof body === 'string' ? body : body.error || JSON.stringify(body))) ||
        e.message ||
        'login failed';
      return { ok: false, error: msg };
    }
    return { ok: false, error: 'no token returned' };
  }

  async function register(email, password, name) {
    try {
      const data = await fetchJson('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || { email });
        try { if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken); } catch (e) {}
        return { ok: true };
      }
    } catch (e) {
      const body = e && e.body;
      const msg =
        (body && (typeof body === 'string' ? body : body.error || JSON.stringify(body))) ||
        e.message ||
        'register failed';
      return { ok: false, error: msg };
    }
    return { ok: false, error: 'no token returned' };
  }

  function logout() {
    setToken(null);
    setUser(null);
    try {
      // notify server to clear refresh cookie
      fetchJson('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (e) {}
    try { localStorage.removeItem('refreshToken'); } catch (e) {}
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
