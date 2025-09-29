import { readFileSync, writeFileSync } from "fs";
import { resolve, extname, basename } from "path";
import { command, positional, option, flag, string, optional } from "cmd-ts";
import { JSONSchema7 } from "json-schema";
import {
  extractTranslationKeysFromSchema,
  TranslationGenerationOptions,
} from "@graviola/json-schema-utils";

function validateSchema(schema: any): schema is JSONSchema7 {
  if (typeof schema !== "object" || schema === null) {
    return false;
  }

  // Basic validation - should have type or properties or definitions
  return !!(
    schema.type ||
    schema.properties ||
    schema.definitions ||
    schema.$defs
  );
}

function generateOutputPath(inputPath: string): string {
  const ext = extname(inputPath);
  const base = basename(inputPath, ext);
  const dir = inputPath.substring(
    0,
    inputPath.length - basename(inputPath).length,
  );
  return resolve(dir, `${base}.translations.json`);
}

export const generateTranslationsCommand = command({
  name: "generate-translations",
  description: "Generate i18n translation files from JSON Schema",
  version: "1.0.0",
  args: {
    input: positional({
      type: string,
      displayName: "input-file",
      description: "Path to JSON Schema file (.json)",
    }),
    output: option({
      type: optional(string),
      long: "output",
      short: "o",
      description:
        "Output file path (default: <input-basename>.translations.json)",
    }),
    includeDescription: flag({
      long: "description",
      short: "d",
      description: "Include description translations with _description suffix",
    }),
  },
  handler: async ({ input, output, includeDescription }) => {
    try {
      // Resolve input path
      const inputPath = resolve(input);

      // Check file extension
      if (extname(inputPath) !== ".json") {
        console.error("Error: Input file must be a .json file");
        process.exit(1);
      }

      // Read and parse JSON Schema
      let schema: JSONSchema7;
      try {
        const schemaContent = readFileSync(inputPath, "utf-8");
        schema = JSON.parse(schemaContent);
      } catch (error) {
        console.error(
          `Error reading or parsing input file: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }

      // Validate schema
      if (!validateSchema(schema)) {
        console.error(
          "Error: Input file does not appear to be a valid JSON Schema",
        );
        process.exit(1);
      }

      // Generate output path
      const outputPath = output
        ? resolve(output)
        : generateOutputPath(inputPath);

      // Generate translations
      const translationOptions: TranslationGenerationOptions = {
        includeDescription: includeDescription || false,
      };

      console.log(`Generating translations from: ${inputPath}`);
      if (includeDescription) {
        console.log("Including description translations");
      }

      const translations = extractTranslationKeysFromSchema(
        schema,
        translationOptions,
      );

      // Write output file
      try {
        writeFileSync(
          outputPath,
          JSON.stringify(translations, null, 2),
          "utf-8",
        );
        console.log(`Translation file generated: ${outputPath}`);
      } catch (error) {
        console.error(
          `Error writing output file: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});
