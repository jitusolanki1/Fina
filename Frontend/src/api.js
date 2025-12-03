import axios from "axios";
import BASE_URL from "./api/helper";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

let isRefreshing = false;
let refreshQueue = [];

async function tryRefresh() {
  try {
    const r = await api.post("/auth/refresh");
    const data = r.data || {};
    if (data.token) {
      setAccessToken(data.token);
      return data.token;
    }
  } catch (err) {
    // swallow
  }
  return null;
}

api.interceptors.response.use(
  (resp) => resp,
  async (err) => {
    const original = err.config;
    if (!original || original._retry) return Promise.reject(err);
    if (err.response && err.response.status === 401) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefresh();
        isRefreshing = false;
        // resume queued
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        if (newToken) {
          original.headers["Authorization"] = `Bearer ${newToken}`;
          return api(original);
        }
        return Promise.reject(err);
      }

      // if a refresh is already in progress, queue the request
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (token) {
            original.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(original));
          } else {
            reject(err);
          }
        });
      });
    }
    return Promise.reject(err);
  }
);

export default api;
