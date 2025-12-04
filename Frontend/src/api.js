// Lightweight compatibility wrapper that re-exports the fetchClient API in an axios-like shape.
import { fetchJson, setAccessToken as _setAccessToken } from "./fetchClient";

export function setAccessToken(token) {
  return _setAccessToken(token);
}

function wrapResp(data) {
  return { data };
}

const api = {
  get: (path, opts) => fetchJson(path, { method: 'GET', ...(opts || {}) }).then((d) => wrapResp(d)),
  post: (path, body, opts) => fetchJson(path, { method: 'POST', body: JSON.stringify(body), ...(opts || {}) }).then((d) => wrapResp(d)),
  patch: (path, body, opts) => fetchJson(path, { method: 'PATCH', body: JSON.stringify(body), ...(opts || {}) }).then((d) => wrapResp(d)),
  delete: (path, opts) => fetchJson(path, { method: 'DELETE', ...(opts || {}) }).then((d) => wrapResp(d)),
};

export default api;
