import pkg from "./package.json" with { type: "json" };
import { makeConfigWithExternals } from "@graviola/edb-tsup-config/tsup.config.js";

export default {
  ...makeConfigWithExternals(pkg),
  entry: ["src/index.ts", "src/testing/in-memory-adapter.ts"],
};
