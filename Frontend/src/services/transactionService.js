import api from "../api";
import { encryptString, decryptString } from "./crypto";

export async function listTransactions(query = {}) {
  const resp = await api.get('/transactions', { params: query });
  const data = resp.data || [];
  const key = import.meta.env.VITE_ENCRYPTION_KEY || "";
  if (!key) return data;
  try {
    // decrypt dateEncrypted into date when present
    const out = await Promise.all(
      data.map(async (tx) => {
        if (tx.dateEncrypted) {
          try {
            const d = await decryptString(tx.dateEncrypted, key);
            return { ...tx, date: d };
          } catch (e) {
            return tx;
          }
        }
        return tx;
      })
    );
    return out;
  } catch (e) {
    return data;
  }
}

export async function createTransaction(tx) {
  const payload = Object.assign({}, tx);
  try {
    const key = import.meta.env.VITE_ENCRYPTION_KEY || "36edf64284417658f03d83fa56b5fec9";
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
