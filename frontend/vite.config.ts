import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: loadEnv(mode, ".", "").BACKEND_URL || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
}));
