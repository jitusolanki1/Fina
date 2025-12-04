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
});
