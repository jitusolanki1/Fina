import { fetchJson } from "../fetchClient";

export async function listHistory(query = {}) {
  const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
  return await fetchJson(`/transactionsHistory${qs}`) || [];
}

export async function createHistory(payload) {
  return await fetchJson('/transactionsHistory', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteHistory(id) {
  return await fetchJson(`/transactionsHistory/${id}`, { method: 'DELETE' });
}
