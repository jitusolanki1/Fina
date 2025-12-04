import { fetchJson, setAccessToken } from "../fetchClient";

export async function login(email, password) {
  const data = await fetchJson('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (data?.token) {
    setAccessToken(data.token);
    return { ok: true, user: data.user };
  }
  return { ok: false };
}

export async function register(email, password, name) {
  const data = await fetchJson('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
  if (data?.token) {
    setAccessToken(data.token);
    return { ok: true, user: data.user };
  }
  return { ok: false };
}

export async function refresh() {
  const data = await fetchJson('/auth/refresh', { method: 'POST' });
  if (data?.token) {
    setAccessToken(data.token);
    return { ok: true, token: data.token, user: data.user };
  }
  return { ok: false };
}

export async function logout() {
  try {
    await fetchJson('/auth/logout', { method: 'POST' });
  } catch (e) {}
  setAccessToken(null);
}
