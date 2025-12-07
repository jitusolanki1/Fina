import { fetchJson } from "../fetchClient";

export async function listAccounts() {
  const r = await fetchJson('/accounts') || [];
  const items = r || [];
  // normalize id field for frontend convenience
  return items.map((it) => ({ ...it, id: it.id || it._id || it.uuid }));
}

export async function getAccount(id) {
  const it = await fetchJson(`/accounts/${id}`);
  if (!it) return null;
  return { ...it, id: it.id || it._id || it.uuid };
}

export async function createAccount(payload) {
  // Only send the name when creating an account; opening balance is handled as a transaction.
  const body = { name: payload.name };
  const it = await fetchJson('/accounts', { method: 'POST', body: JSON.stringify(body) });
  return it ? { ...it, id: it.id || it._id || it.uuid } : it;
}

export async function updateAccount(id, patch) {
  const it = await fetchJson(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  return it ? { ...it, id: it.id || it._id || it.uuid } : it;
}

export async function deleteAccount(id) {
  return await fetchJson(`/accounts/${id}`, { method: 'DELETE' });
}
