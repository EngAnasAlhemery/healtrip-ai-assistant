import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Forward local API requests from the frontend to the Express backend.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});