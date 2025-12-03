try {
  await import("dotenv/config");
} catch (err) {
  try {
    const d = await import("dotenv");
    d.config();
  } catch (e) {}
}
import app from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Fina backend listening on http://localhost:${PORT}`);
});
