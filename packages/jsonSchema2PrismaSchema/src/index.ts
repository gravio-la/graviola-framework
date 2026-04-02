#!/usr/bin/env node
import { jsonSchema2Prisma } from "@graviola/json-schema-prisma-utils";
import { extendSchemaShortcut } from "@graviola/json-schema-utils";
import { execSync } from "child_process";
import {
  flag,
  command,
  option,
  optional,
  positional,
  run,
  string,
} from "cmd-ts";
import fs from "fs";
import { tmpdir } from "os";
import { join } from "path";

const app = command({
  name: "jsonSchema2Prisma",
  description: "Convert JSON Schema to Prisma Schema",
  version: "0.1.5",
  args: {
    schemaPath: positional({
      type: string,
      displayName: "schemaPath",
      description: "Path to the JSON Schema file",
    }),
    output: option({
      type: optional(string),
      long: "output",
      short: "o",
      description: "Output file path (default: stdout)",
    }),
    noPreamble: flag({
      long: "no-preamble",
      description: "Skip adding the default preamble",
    }),
    format: flag({
      long: "format",
      short: "f",
      description: "Format the output using prisma format",
    }),
    extendSchema: flag({
      long: "extend-schema",
      description:
        "Extend the schema with the default @id and @type properties",
    }),
  },
  handler: async ({ schemaPath, output, noPreamble, format, extendSchema }) => {
    const jsonSchema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    const schema = extendSchema ? extendSchemaShortcut(jsonSchema) : jsonSchema;
    const prismaSchema = jsonSchema2Prisma(schema, new WeakSet<any>());

    let result = prismaSchema;
    if (!noPreamble) {
      const preamble = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}
`;
      result = `${preamble}${prismaSchema}`;
    }

    if (format) {
      // Create a temporary file in the system's temp directory
      const tempDir = tmpdir();
      const tempFile = join(tempDir, `schema-${Date.now()}.prisma`);

      try {
        fs.writeFileSync(tempFile, result);
        execSync(`prisma format --schema ${tempFile}`);
        result = fs.readFileSync(tempFile, "utf-8");
        fs.unlinkSync(tempFile);
      } catch (error) {
        console.error("Error formatting schema:", error);
        // Clean up temp file if it exists
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        process.exit(1);
      }
    }

    if (output) {
      fs.writeFileSync(output, result);
      console.log(`Schema written to ${output}`);
    } else {
      console.log(result);
    }
  },
});

run(app, process.argv.slice(2));
