import api, { setAccessToken } from "../api";

export async function login(email, password) {
  const resp = await api.post('/auth/login', { email, password });
  const data = resp.data || {};
  if (data.token) {
    setAccessToken(data.token);
    return { ok: true, user: data.user };
  }
  return { ok: false };
}

export async function register(email, password, name) {
  const resp = await api.post('/auth/register', { email, password, name });
  const data = resp.data || {};
  if (data.token) {
    setAccessToken(data.token);
    return { ok: true, user: data.user };
  }
  return { ok: false };
}

export async function refresh() {
  const resp = await api.post('/auth/refresh');
  const data = resp.data || {};
  if (data.token) {
    setAccessToken(data.token);
    return { ok: true, token: data.token, user: data.user };
  }
  return { ok: false };
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (e) {}
  setAccessToken(null);
}
