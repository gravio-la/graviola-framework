import { parse as parseYaml } from "yaml";

import {
  mappingDeclarationYamlSchema,
  secondaryDataSourceDeclarationSchema,
  type SecondaryDataSourceDeclaration,
} from "./types";

export type YamlValidationError = {
  line?: number;
  column?: number;
  message: string;
};

export function parseDeclarationYaml(
  yamlText: string,
):
  | { ok: true; data: SecondaryDataSourceDeclaration }
  | { ok: false; errors: YamlValidationError[] } {
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (err) {
    const e = err as {
      linePos?: Array<{ line: number; col: number }>;
      message?: string;
    };
    const pos = e.linePos?.[0];
    return {
      ok: false,
      errors: [
        {
          line: pos?.line,
          column: pos?.col,
          message: e.message ?? "YAML parse error",
        },
      ],
    };
  }

  const result = secondaryDataSourceDeclarationSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => ({
        message: `${issue.path.join(".")}: ${issue.message}`,
      })),
    };
  }
  return { ok: true, data: result.data as SecondaryDataSourceDeclaration };
}

export function parseMappingYaml(
  yamlText: string,
):
  | { ok: true; data: unknown[] }
  | { ok: false; errors: YamlValidationError[] } {
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (err) {
    const e = err as {
      linePos?: Array<{ line: number; col: number }>;
      message?: string;
    };
    const pos = e.linePos?.[0];
    return {
      ok: false,
      errors: [
        {
          line: pos?.line,
          column: pos?.col,
          message: e.message ?? "YAML parse error",
        },
      ],
    };
  }

  const result = mappingDeclarationYamlSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => ({
        message: `${issue.path.join(".")}: ${issue.message}`,
      })),
    };
  }
  return { ok: true, data: result.data };
}
