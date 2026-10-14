import type { ControlElement } from "@jsonforms/core";
import { isControl } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

function schemaTypeIncludes(
  schema: JSONSchema7 | undefined,
  kind: string,
): boolean {
  const t = schema?.type;
  if (t === kind) return true;
  return Array.isArray(t) && t.includes(kind);
}

export function isLeafValueSchema(schema: JSONSchema7 | undefined): boolean {
  if (!schema || typeof schema !== "object") return false;
  if (schema.$ref) return false;
  if (schema.properties || schema.items) return false;
  if (schemaTypeIncludes(schema, "object")) return false;
  if (schemaTypeIncludes(schema, "array")) return false;
  return (
    schemaTypeIncludes(schema, "string") ||
    schemaTypeIncludes(schema, "number") ||
    schemaTypeIncludes(schema, "integer") ||
    schemaTypeIncludes(schema, "boolean") ||
    schema.enum != null
  );
}

export function isCompactLeafObjectSchema(
  schema: JSONSchema7 | undefined,
): boolean {
  if (!schema || !schema.properties) return false;
  if (schemaTypeIncludes(schema, "array")) return false;
  const props = Object.entries(schema.properties).filter(
    ([key]) => !key.startsWith("@"),
  );
  if (props.length === 0) return false;
  return props.every(([, sub]) => isLeafValueSchema(sub as JSONSchema7));
}

function isMarkdownSchema(schema: JSONSchema7): boolean {
  if (schema.contentMediaType === "text/markdown") return true;
  return false;
}

function isLongOrRichScalar(schema: JSONSchema7): boolean {
  if (schema.format === "uri") return true;
  if (
    typeof schema.contentMediaType === "string" &&
    schema.contentMediaType.startsWith("image/")
  ) {
    return true;
  }
  if (typeof schema.maxLength === "number" && schema.maxLength > 120) {
    return true;
  }
  if (isMarkdownSchema(schema)) return true;
  return false;
}

export function isMetaStripEligibleControl(
  uiSchema: unknown,
  propSchema: JSONSchema7 | undefined,
  ctx: DetailTesterContext,
  propertyName: string | undefined,
): boolean {
  if (ctx.viewSize && ctx.viewSize !== "detail") return false;
  if (ctx.depth !== 0) return false;
  if (!isControl(uiSchema as ControlElement)) return false;
  if (!propertyName || !propSchema) return false;
  if (ctx.headerPrimaryFieldNames?.includes(propertyName)) return false;
  if (!isLeafValueSchema(propSchema)) return false;
  if (isLongOrRichScalar(propSchema)) return false;
  const options = (uiSchema as ControlElement).options;
  if (options?.markdown === true) return false;
  return true;
}

export function controlMarkdownOption(uiSchema: unknown): boolean {
  if (!isControl(uiSchema as ControlElement)) return false;
  return (uiSchema as ControlElement).options?.markdown === true;
}
