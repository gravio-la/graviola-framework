import { makeConfigWithExternals } from "@graviola/edb-tsup-config/tsup.config.js";
import pkg from "./package.json";

const config = {
  ...makeConfigWithExternals(pkg),
  dts: true,
};
export default config;
