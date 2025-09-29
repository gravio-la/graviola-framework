import { run, subcommands } from "cmd-ts";
import { generateTranslationsCommand } from "./commands/generateTranslations";

const cli = subcommands({
  name: "json-schema-cli",
  version: "1.0.0",
  description: "CLI tools for working with JSON Schema",
  cmds: {
    "generate-translations": generateTranslationsCommand,
  },
});

run(cli, process.argv.slice(2));
