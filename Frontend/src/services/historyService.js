import api from "../api";

export async function listHistory(query = {}) {
  const r = await api.get("/transactionsHistory", { params: query });
  return r.data;
}

export async function createHistory(payload) {
  const r = await api.post("/transactionsHistory", payload);
  return r.data;
}

export async function deleteHistory(id) {
  const r = await api.delete(`/transactionsHistory/${id}`);
  return r.data;
}
