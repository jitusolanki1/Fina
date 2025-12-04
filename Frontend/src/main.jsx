import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider";

window.addEventListener("error", (ev) => {
  try {
    if (
      ev &&
      ev.message &&
      ev.message.includes("Failed to fetch dynamically imported module")
    ) {
      console.error(
        "Dynamic import failed. The requested chunk returned HTML (probably index.html). This usually means the built asset is missing or the `base` is incorrect for your deployment. Check your hosting deploy and vite `base` setting."
      );
    }
  } catch (e) {}
});

window.addEventListener("unhandledrejection", (ev) => {
  try {
    const reason = ev && ev.reason && String(ev.reason);
    if (
      reason &&
      reason.includes("Failed to fetch dynamically imported module")
    ) {
      console.error(
        "Unhandled rejection: dynamic import failed. Verify built assets are present on the server and that the app is served from the correct base path."
      );
    }
  } catch (e) {}
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
