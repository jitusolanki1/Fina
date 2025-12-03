import api from "../api";
import { encryptString } from "./crypto";

export async function listTransactions(query = {}) {
  const resp = await api.get('/transactions', { params: query });
  return resp.data;
}

export async function createTransaction(tx) {
  const payload = Object.assign({}, tx);
  try {
    const key = import.meta.env.VITE_ENCRYPTION_KEY;
    if (payload.date && key) {
      payload.dateEncrypted = await encryptString(String(payload.date), key);
      delete payload.date;
    }
  } catch (e) {
    // ignore encryption errors and send plain date
  }
  const resp = await api.post('/transactions', payload);
  return resp.data;
}

export async function deleteTransaction(id) {
  const resp = await api.delete(`/transactions/${id}`);
  return resp.data;
}

export async function updateTransaction(id, patch) {
  const resp = await api.patch(`/transactions/${id}`, patch);
  return resp.data;
}
