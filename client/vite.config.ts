import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, ".."), // Use root .env file
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false, // Allow non-HTTPS in development
        cookieDomainRewrite: "localhost", // Rewrite cookie domain for proxy
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
