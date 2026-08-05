import { makeConfigWithExternals } from "@graviola/edb-tsup-config/tsup.config.js";
import pkg from "./package.json";

export default {
  ...makeConfigWithExternals(pkg),
  entry: ["src/index.ts", "src/cli.ts"],
  // dts only for the library entry — CLI is a Bun script, not a typed export
  dts: { entry: { index: "src/index.ts" } },
};
