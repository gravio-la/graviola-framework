import { createRequire } from "node:module";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);
const bufferPath = require.resolve("buffer/");

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: [
      { find: "buffer", replacement: bufferPath },
      { find: "node:buffer", replacement: bufferPath },
    ],
  },
  optimizeDeps: {
    include: ["buffer"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  esbuild: {
    pure: ["console.debug", "console.log"],
  },
});
