import api from "../api";

export async function listSummaries(query = {}) {
  const r = await api.get('/summaries', { params: query });
  return r.data;
}

export async function getSummary(id) {
  const r = await api.get(`/summaries/${id}`);
  return r.data;
}

export async function createSummary(payload) {
  const r = await api.post('/summaries', payload);
  return r.data;
}

export async function deleteSummary(id) {
  const r = await api.delete(`/summaries/${id}`);
  return r.data;
}
