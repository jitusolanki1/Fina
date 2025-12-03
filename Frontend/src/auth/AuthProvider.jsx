import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAccessToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

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
        // try fallback refresh token stored in localStorage (set during login in non-production)
        try {
          const fallback = localStorage.getItem("refreshTokenFallback");
          if (fallback) {
            const r2 = await api.post("/auth/refresh", { refreshToken: fallback });
            const d2 = r2?.data;
            if (d2?.token && mounted) {
              setToken(d2.token);
              setUser(d2.user || null);
              setAccessToken(d2.token);
            }
          }
        } catch (e2) {
          // still no refresh available
        }
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
        // persist fallback refresh token in non-production when server returns it
        try { if (data.refreshToken) localStorage.setItem("refreshTokenFallback", data.refreshToken); } catch (e) {}
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
        try { if (data.refreshToken) localStorage.setItem("refreshTokenFallback", data.refreshToken); } catch (e) {}
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
    try { localStorage.removeItem("refreshTokenFallback"); } catch (e) {}
    try {
      // notify server to clear refresh cookie
      api.post("/auth/logout").catch(() => {});
    } catch (e) {}
  }

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
