import baseConfig from "@graviola/edb-tsup-config/tsup.config.js";

/** @type {import("tsup").Options} */
export default {
  ...baseConfig,
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
};
