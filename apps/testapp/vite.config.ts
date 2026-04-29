import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  esbuild: {
    // Mark console.debug / console.log as side-effect-free.
    // Vite's esbuild transform annotates them with /* @__PURE__ */ on every
    // file it processes (including library dist files from node_modules).
    // During `vite dev` the annotations are added but calls are NOT removed —
    // debug output is fully visible. During `vite build` rollup's tree-shaker
    // honours the annotations and eliminates the calls in the final bundle.
    pure: ["console.debug", "console.log"],
  },
});
