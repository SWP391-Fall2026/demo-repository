import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                // `loadEnv` reads .env files, but not arbitrary process variables.
                // Keep shell based local overrides working for isolated test servers.
                target: process.env.BACKEND_URL || loadEnv(mode, ".", "").BACKEND_URL || "http://127.0.0.1:8080",
                changeOrigin: true,
            },
        },
    },
}));
