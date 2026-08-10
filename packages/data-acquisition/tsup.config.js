import { defineConfig } from "tsup";
import { makeConfigWithExternals } from "@graviola/edb-tsup-config/tsup.config.js";
import pkg from "./package.json";

const base = makeConfigWithExternals(pkg);

export default defineConfig({
  ...base,
  entry: ["src/index.ts", "src/cache/node-entry.ts"],
});
