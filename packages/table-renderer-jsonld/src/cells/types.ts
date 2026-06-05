import type { JSONSchema7 } from "json-schema";

export type JsonLdCellMeta = {
  jsonLdScope: string;
  jsonLdPropSchema: JSONSchema7;
  jsonLdRootSchema: JSONSchema7;
  jsonLdColumnOptions?: Record<string, unknown>;
};

export function readJsonLdCellMeta(meta: unknown): JsonLdCellMeta | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Partial<JsonLdCellMeta>;
  if (
    typeof m.jsonLdScope !== "string" ||
    !m.jsonLdPropSchema ||
    !m.jsonLdRootSchema
  ) {
    return null;
  }
  return m as JsonLdCellMeta;
}
