import api from "../api";

export async function listAccounts() {
  const r = await api.get('/accounts');
  return r.data;
}

export async function getAccount(id) {
  const r = await api.get(`/accounts/${id}`);
  return r.data;
}

export async function createAccount(payload) {
  const r = await api.post('/accounts', payload);
  return r.data;
}

export async function updateAccount(id, patch) {
  const r = await api.patch(`/accounts/${id}`, patch);
  return r.data;
}

export async function deleteAccount(id) {
  const r = await api.delete(`/accounts/${id}`);
  return r.data;
}
