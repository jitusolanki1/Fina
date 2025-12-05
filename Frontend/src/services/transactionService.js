import { fetchJson } from "../fetchClient";
import { encryptString, decryptString } from "./crypto";

export async function listTransactions(query = {}) {
  const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
  const data = await fetchJson(`/transactions${qs}`) || [];
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
    // Normalize transaction shape for frontend convenience:
    // - ensure `id` exists
    // - ensure `accountId` is present (or pulled from nested `account`)
    // - expose `accountName` when available
    const norm = out.map((t) => {
      const id = t.id || t._id || t.uuid || null;
      const accountId = t.accountId || (t.account && (t.account.id || t.account._id || t.account.uuid)) || null;
      const accountName = (t.account && (t.account.name || t.account.accountName)) || null;
      // ensure there's a usable `date` for UI rendering: prefer decrypted `date`, then `date` property, then `createdAt` timestamp
      let dateVal = t.date || null;
      if (!dateVal && t.createdAt) {
        try {
          dateVal = new Date(t.createdAt).toISOString().slice(0, 10);
        } catch (e) {
          dateVal = null;
        }
      }
      return {
        ...t,
        id,
        accountId,
        accountName: t.accountName || accountName || undefined,
        date: dateVal || undefined,
      };
    });
    return norm;
  } catch (e) {
    return data;
  }
}

export async function createTransaction(tx) {
  const payload = Object.assign({}, tx);
  // Defensive: if caller passed an `account` object, extract its id into `accountId`
  try {
    if (!payload.accountId && payload.account && typeof payload.account === 'object') {
      payload.accountId = payload.account.id || payload.account._id || payload.account.uuid || payload.account;
    }
  } catch (e) {}
  try {
    const key = import.meta.env.VITE_ENCRYPTION_KEY || "36edf64284417658f03d83fa56b5fec9";
    if (payload.date && key) {
      payload.dateEncrypted = await encryptString(String(payload.date), key);
      delete payload.date;
    }
  } catch (e) {
    // ignore encryption errors and send plain date
  }
  const resp = await fetchJson('/transactions', { method: 'POST', body: JSON.stringify(payload) });
  return resp;
}

export async function deleteTransaction(id) {
  const resp = await fetchJson(`/transactions/${id}`, { method: 'DELETE' });
  return resp;
}

export async function updateTransaction(id, patch) {
  const resp = await fetchJson(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  return resp;
}
