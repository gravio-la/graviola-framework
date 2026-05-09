import type { JSONSchema7 } from "json-schema";
import type { TableUiSchema } from "@graviola/edb-table-types";

export const generateDefaultTableUiSchema = (
  schema: JSONSchema7,
  options: {
    typeName: string;
    mode?: "whitelist" | "blacklist";
    skipScope?: string[];
    depthLimit?: number;
  },
): TableUiSchema => {
  const skip = new Set(options.skipScope || []);
  const columns = Object.keys(schema?.properties || {})
    .map((key) => `#/properties/${key}`)
    .filter((scope) => !skip.has(scope))
    .map((scope) => ({
      scope,
      visibility: "visible" as const,
    }));

  return {
    type: "Table",
    mode: options.mode || "blacklist",
    columns,
  };
};
