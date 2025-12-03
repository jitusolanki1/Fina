import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // avoid chunk-size warning being too noisy; still split large deps via manualChunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3') ) {
              return 'vendor_recharts';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor_react';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
