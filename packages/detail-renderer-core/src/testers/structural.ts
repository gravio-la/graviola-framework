import {
  and,
  formatIs,
  isBooleanControl,
  isControl,
  isNumberControl,
  isOneOfControl,
  isStringControl,
  or,
  rankWith,
} from "@jsonforms/core";
import type { Tester } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

function schemaObjectProperties(
  schema: JSONSchema7 | undefined,
): Record<string, unknown> | undefined {
  return schema?.properties as Record<string, unknown> | undefined;
}

/** Object schema declares RDF entity markers (`@id` and/or `@type`). */
export function isEntityLikeObjectSchema(
  schema: JSONSchema7 | undefined,
): boolean {
  if (schema?.type !== "object") return false;
  const props = schemaObjectProperties(schema);
  return Boolean(props?.["@id"] || props?.["@type"]);
}

export const isNamedEntity: Tester = (_uischema, schema) =>
  isEntityLikeObjectSchema(schema as JSONSchema7);

/** @deprecated Prefer {@link isNamedEntity} — kept for registry export name stability. */
export const isTypedEntity = isNamedEntity;

export const isArrayOfNamedEntitys: Tester = (_uischema, schema) => {
  const s = schema as JSONSchema7;
  if (s?.type !== "array") return false;
  const items = s.items as JSONSchema7 | undefined;
  if (!items || typeof items === "boolean") return false;
  return isEntityLikeObjectSchema(items);
};

export const isArrayOfPrimitives: Tester = (_uischema, schema) => {
  const s = schema as JSONSchema7;
  if (s?.type !== "array") return false;
  const itemType = (s.items as JSONSchema7 | undefined)?.type;
  return (
    typeof itemType === "string" &&
    ["string", "number", "integer", "boolean"].includes(itemType)
  );
};

/** Array whose items schema is object with no entity markers (embedded / anonymous). */
export const isArrayOfInlineObjects: Tester = (_uischema, schema) => {
  const s = schema as JSONSchema7;
  if (s?.type !== "array") return false;
  const items = s.items as JSONSchema7 | undefined;
  if (!items || typeof items === "boolean") return false;
  if (items.type !== "object") return false;
  return !isEntityLikeObjectSchema(items);
};

export const isInlineObject: Tester = (_uischema, schema) => {
  const s = schema as JSONSchema7;
  return s?.type === "object" && !isEntityLikeObjectSchema(s);
};

export const namedEntityTester = rankWith(5, isNamedEntity);
export const arraynamedEntityTester = rankWith(4, isArrayOfNamedEntitys);
export const arrayPrimitiveTester = rankWith(3, isArrayOfPrimitives);
export const arrayInlineObjectTester = rankWith(3, isArrayOfInlineObjects);
export const inlineObjectTester = rankWith(2, isInlineObject);
export const booleanTester = rankWith(3, isBooleanControl);
export const uriTester = rankWith(3, and(isControl, formatIs("uri")));

/**
 * String whose `contentMediaType` declares an image ("image/jpeg", "image/*", …).
 * Combined with `format: "uri"` this marks a property holding an image URL.
 */
export const isImageMediaControl: Tester = (_uischema, schema) => {
  const s = schema as JSONSchema7 | undefined;
  return (
    typeof s?.contentMediaType === "string" &&
    s.contentMediaType.startsWith("image/")
  );
};

export const imageUriTester = rankWith(
  5,
  and(isControl, formatIs("uri"), isImageMediaControl),
);
export const dateTester = rankWith(4, and(isControl, formatIs("date")));
export const dateTimeTester = rankWith(
  4,
  and(isControl, formatIs("date-time")),
);
/** String enums / const oneOf — rank above object union oneOf (rank 6). */
export const enumTester = rankWith(8, and(isOneOfControl, isStringControl));

/** JSON Schema `integer` is not matched by jsonforms `isNumberControl`. */
export const isIntegerControl: Tester = (_uischema, schema) =>
  (schema as JSONSchema7)?.type === "integer";

export const isNumberOrIntegerControl: Tester = or(
  isNumberControl,
  isIntegerControl,
);

export const numberTester = rankWith(
  2,
  and(isControl, isNumberOrIntegerControl),
);
export const stringTester = rankWith(1, isStringControl);

/** Discriminated union with at least one object branch — defer to AnyOfDetailRenderer */
export const isAnyOfObjectUnion: Tester = (_u, s) => {
  const j = s as JSONSchema7 | undefined;
  if (!j?.anyOf || !Array.isArray(j.anyOf)) return false;
  return j.anyOf.some((b) => (b as JSONSchema7).type === "object");
};

export const anyOfObjectUnionTester = rankWith(6, isAnyOfObjectUnion);

/** Discriminated union with at least one object branch */
export const isOneOfObjectUnion: Tester = (_u, s) => {
  const j = s as JSONSchema7 | undefined;
  if (!j?.oneOf || !Array.isArray(j.oneOf)) return false;
  return j.oneOf.some((b) => (b as JSONSchema7).type === "object");
};

export const oneOfObjectUnionTester = rankWith(6, isOneOfObjectUnion);
