/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: true,
    host: "0.0.0.0",
    allowedHosts: ["jetlag.rafuse.dev"],
    // Proxy API calls to the standalone express resolve server (pnpm server).
    proxy: {
      "/api": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: false,
  },
});
