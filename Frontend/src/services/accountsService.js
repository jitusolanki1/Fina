import api from "../api";

export async function listAccounts() {
  const r = await api.get('/accounts');
  const items = r.data || [];
  // normalize id field for frontend convenience
  return items.map((it) => ({ ...it, id: it.id || it._id || it.uuid }));
}

export async function getAccount(id) {
  const r = await api.get(`/accounts/${id}`);
  const it = r.data;
  if (!it) return null;
  return { ...it, id: it.id || it._id || it.uuid };
}

export async function createAccount(payload) {
  const r = await api.post('/accounts', payload);
  const it = r.data;
  return it ? { ...it, id: it.id || it._id || it.uuid } : it;
}

export async function updateAccount(id, patch) {
  const r = await api.patch(`/accounts/${id}`, patch);
  const it = r.data;
  return it ? { ...it, id: it.id || it._id || it.uuid } : it;
}

export async function deleteAccount(id) {
  const r = await api.delete(`/accounts/${id}`);
  return r.data;
}
