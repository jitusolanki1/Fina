// Try to load dotenv if available, but don't crash if it's not installed on the host.
try {
  // Prefer import of the config helper when possible
  // Use dynamic import so missing package doesn't throw at module evaluation time
  await import('dotenv/config');
} catch (err) {
  try {
    const d = await import('dotenv');
    d.config();
  } catch (e) {
    // dotenv not available; proceed using environment provided by the host
  }
}

import app from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Fina backend listening on http://localhost:${PORT}`);
});
