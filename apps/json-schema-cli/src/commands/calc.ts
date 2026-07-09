import { readFileSync } from "fs";
import { resolve } from "path";
import {
  command,
  positional,
  option,
  string,
  optional,
  subcommands,
} from "cmd-ts";
import type { JSONSchema7 } from "json-schema";
import {
  compileCalcProfile,
  explainCompiledSlot,
  CalcProfileCompileError,
  type CalcProfileSidecar,
} from "@graviola/formula-dependency";

function loadJson(path: string): unknown {
  const content = readFileSync(resolve(path), "utf-8");
  return JSON.parse(content);
}

const explainCommand = command({
  name: "explain",
  description:
    "Explain a compiled calc slot (strata chain, dependents, formula)",
  args: {
    scope: positional({
      type: string,
      displayName: "scope",
      description:
        "JSON Pointer scope, e.g. '#/definitions/Garden/properties/annual_fee'",
    }),
    schema: option({
      type: string,
      long: "schema",
      short: "s",
      description: "Path to domain JSON Schema file",
    }),
    sidecar: option({
      type: string,
      long: "sidecar",
      description: "Path to calc-profile sidecar JSON file",
    }),
    boundary: option({
      type: optional(string),
      long: "boundary",
      description: "Optional boundary profile JSON file",
    }),
  },
  handler: ({ scope, schema: schemaPath, sidecar: sidecarPath, boundary }) => {
    try {
      const domainSchema = loadJson(schemaPath) as JSONSchema7;
      const sidecar = loadJson(sidecarPath) as CalcProfileSidecar;
      const boundaryProfile = boundary
        ? (loadJson(boundary) as {
            authRuleScopes?: string[];
            completenessSlots?: string[];
          })
        : {};

      const profile = compileCalcProfile(
        sidecar,
        domainSchema,
        boundaryProfile,
      );
      const explanation = explainCompiledSlot(profile, scope);

      if (!explanation) {
        console.error(`Scope not found in compiled profile: ${scope}`);
        process.exit(1);
      }

      console.log(explanation);
    } catch (error) {
      if (error instanceof CalcProfileCompileError) {
        console.error(error.message);
        process.exit(1);
      }
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});

export const calcCommand = subcommands({
  name: "calc",
  description: "Calculated-field sidecar tools",
  cmds: {
    explain: explainCommand,
  },
});
