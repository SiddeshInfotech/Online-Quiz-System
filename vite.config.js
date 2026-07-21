import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react-router-dom") || id.includes("react/")) {
              return "vendor-react";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react") || id.includes("react-icons")) {
              return "vendor-icons";
            }
            return "vendor";
          }
        },
      },
    },
  },
});