// Prefer runtime-configurable Vite env variable so deployments can set API URL.
// Set VITE_API_URL in your hosting environment (e.g. Netlify/Render) to the full API base
// including the `/api` prefix if your backend exposes routes under `/api`.
let BASE_URL = import.meta.env.VITE_API_URL || null;

if (!BASE_URL) {
  // fallback by NODE_ENV for local dev convenience
  BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://fina-nbnq.onrender.com/api'
    : 'http://localhost:4000/api';
}

export default BASE_URL;
