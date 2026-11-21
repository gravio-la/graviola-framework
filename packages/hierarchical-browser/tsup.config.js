import { makeConfigWithExternals } from "@graviola/edb-tsup-config/tsup.config.js";
import pkg from "./package.json";

export default makeConfigWithExternals(pkg);
