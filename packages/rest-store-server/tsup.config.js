import { makeConfigWithExternals } from "@graviola/edb-tsup-config/tsup.config.js";
import pkg from "./package.json";

const config = {
  ...makeConfigWithExternals(pkg),
  // Bun adapter as separate entry: keeps `Bun`-global code out of the main
  // WinterCG bundle, consumed via the "./bun" subpath export.
  entry: ["src/index.ts", "src/adapters/bun.ts"],
  dts: true,
};
export default config;
