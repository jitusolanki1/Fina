import { fetchJson } from "../fetchClient";

export async function listSummaries(query = {}) {
  const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
  return await fetchJson(`/summaries${qs}`) || [];
}

export async function getSummary(id) {
  return await fetchJson(`/summaries/${id}`);
}

export async function createSummary(payload) {
  return await fetchJson('/summaries', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteSummary(id) {
  return await fetchJson(`/summaries/${id}`, { method: 'DELETE' });
}
