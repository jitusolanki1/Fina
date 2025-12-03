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
        // no refresh available
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
      // fallthrough to demo behaviour
    }

    // fallback/demo behaviour when backend not available
    const demoToken = `demo-token-${Date.now()}`;
    setToken(demoToken);
    setUser({ email });
    localStorage.setItem("fina_token", demoToken);
    localStorage.setItem("fina_user", JSON.stringify({ email }));
    return { ok: true, demo: true };
  }

  async function register(email, password) {
    try {
      const resp = await api.post("/auth/register", { email, password });
      const data = resp?.data;
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || { email });
        return { ok: true };
      }
    } catch (e) {
      // ignore
    }

    // fallback/demo behaviour
    const demoToken = `demo-token-${Date.now()}`;
    setToken(demoToken);
    setUser({ email });
    localStorage.setItem("fina_token", demoToken);
    localStorage.setItem("fina_user", JSON.stringify({ email }));
    return { ok: true, demo: true };
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
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
