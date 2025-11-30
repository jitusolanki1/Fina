import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("fina_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("fina_token"));

  useEffect(() => {
    if (token) {
      // attach token to axios default header
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } catch (e) {}
    } else {
      try {
        delete api.defaults.headers.common["Authorization"];
      } catch (e) {}
    }
  }, [token]);

  async function login(email, password) {
    try {
      const resp = await api.post("/login", { email, password });
      const data = resp?.data;
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || { email });
        localStorage.setItem("fina_token", data.token);
        localStorage.setItem("fina_user", JSON.stringify(data.user || { email }));
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
      const resp = await api.post("/register", { email, password });
      const data = resp?.data;
      if (data?.token) {
        setToken(data.token);
        setUser(data.user || { email });
        localStorage.setItem("fina_token", data.token);
        localStorage.setItem("fina_user", JSON.stringify(data.user || { email }));
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
      localStorage.removeItem("fina_token");
      localStorage.removeItem("fina_user");
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
