import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "./dist/stats.html",
      title: "Fina bundle analysis",
      open: false,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor_recharts";
            }
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor_react";
            }
            return "vendor";
          }
        },
      },
    },
  },
  // Dev server proxy: forward /api requests to backend server during local development.
  // Set BACKEND_URL env var (e.g. http://localhost:3001) to override the default.
  server: {
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
