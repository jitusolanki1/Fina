const API_BASE =
  import.meta.env.VITE_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://fina-nbnq.onrender.com/api"
    : "http://localhost:4000/api");

let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}

// refresh coordination: ensure only one refresh request runs at a time
let refreshingPromise = null;
let lastRefreshFailedAt = 0;
const REFRESH_COOLDOWN_MS = 30 * 1000; // after a failed refresh, wait 30s before retrying

async function tryRefresh() {
  // if a refresh is already in flight, reuse it
  if (refreshingPromise) return refreshingPromise;

  // cooldown after failure
  if (Date.now() - lastRefreshFailedAt < REFRESH_COOLDOWN_MS) return null;

  refreshingPromise = (async () => {
    try {
      // If client has a stored fallback refresh token (dev), include it in body
      const localRefresh = (() => {
        try { return localStorage.getItem('refreshToken'); } catch (e) { return null; }
      })();

      const refreshOpts = localRefresh
        ? { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: localRefresh }) }
        : { method: 'POST', credentials: 'include' };

      const r = await fetch(`${API_BASE}/auth/refresh`, refreshOpts);
      if (!r.ok) {
        lastRefreshFailedAt = Date.now();
        return null;
      }
      const data = await r.json();
      if (data?.token) {
        setAccessToken(data.token);
        // if server returned a new refresh token, persist it as fallback
        try { if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken); } catch (e) {}
        return data.token;
      }
      return null;
    } catch (e) {
      lastRefreshFailedAt = Date.now();
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

export async function fetchJson(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const merged = { credentials: "include", headers, ...opts };

  let res = await fetch(API_BASE + path, merged);

  if (res.status === 401) {
    // try single coordinated refresh
    const newToken = await tryRefresh();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(API_BASE + path, { ...merged, headers });
    }
  }

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    const body = ct.includes("application/json") ? JSON.parse(text) : text;
    // Normalize error message so UI never receives raw objects
    const errMsg =
      (body && (typeof body === "string" ? body : body.error || JSON.stringify(body))) ||
      res.statusText ||
      "Request failed";
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return ct.includes("application/json") ? JSON.parse(text) : text;
}

export default {
  fetchJson,
  setAccessToken,
};
