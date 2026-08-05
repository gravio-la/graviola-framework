import { makeConfigWithExternals } from "@graviola/edb-tsup-config/tsup.config.js";
import pkg from "./package.json";

const config = {
  ...makeConfigWithExternals(pkg),
  // Bun adapter and testing double as separate entries: keep `Bun`-global
  // code and the in-memory test scaffolding out of the main WinterCG
  // bundle (consumed via "./bun" / "./testing" subpath exports).
  entry: [
    "src/index.ts",
    "src/adapters/bun.ts",
    "src/testing/inMemoryStore.ts",
  ],
  dts: true,
};
export default config;
