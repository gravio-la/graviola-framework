import { defineConfig } from "tsup";
import config from "@graviola/edb-tsup-config/tsup.config.js";

export default defineConfig({
  ...config,
  dts: false,
});
