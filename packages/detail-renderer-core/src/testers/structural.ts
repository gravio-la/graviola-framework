import {
  and,
  formatIs,
  isBooleanControl,
  isControl,
  isNumberControl,
  isOneOfControl,
  isStringControl,
  rankWith,
} from "@jsonforms/core";
import type { Tester } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

export const isEntityRef: Tester = (_uischema, schema) =>
  Boolean((schema as JSONSchema7)?.properties?.["@id"]);

export const isArrayOfEntityRefs: Tester = (_uischema, schema) => {
  const s = schema as JSONSchema7;
  if (s?.type !== "array") return false;
  return Boolean((s.items as JSONSchema7 | undefined)?.properties?.["@id"]);
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

export const isInlineObject: Tester = (_uischema, schema) => {
  const s = schema as JSONSchema7;
  return s?.type === "object" && !s?.properties?.["@id"];
};

export const entityRefTester = rankWith(5, isEntityRef);
export const arrayEntityRefTester = rankWith(4, isArrayOfEntityRefs);
export const arrayPrimitiveTester = rankWith(3, isArrayOfPrimitives);
export const inlineObjectTester = rankWith(2, isInlineObject);
export const booleanTester = rankWith(3, isBooleanControl);
export const uriTester = rankWith(3, and(isControl, formatIs("uri")));
export const dateTester = rankWith(4, and(isControl, formatIs("date")));
export const dateTimeTester = rankWith(
  4,
  and(isControl, formatIs("date-time")),
);
/** String enums / const oneOf — rank above object union oneOf (rank 6). */
export const enumTester = rankWith(8, and(isOneOfControl, isStringControl));
export const numberTester = rankWith(2, isNumberControl);
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
