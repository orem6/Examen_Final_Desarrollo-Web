import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "frontend"),
  publicDir: resolve(projectRoot, "public"),
  plugins: [react()],
  resolve: { alias: { "@": projectRoot } },
  css: { postcss: projectRoot },
  build: {
    outDir: resolve(projectRoot, "dist/frontend"),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    fs: { allow: [projectRoot] },
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://127.0.0.1:3001",
        changeOrigin: false,
      },
    },
  },
});
