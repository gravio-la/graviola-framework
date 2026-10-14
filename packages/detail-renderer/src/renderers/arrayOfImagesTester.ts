import { rankWith } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

/** Multivalued URI strings whose items declare `contentMediaType: image/*`. */
export const arrayOfImageUrisTester = rankWith(4, (_uischema, schema) => {
  const s = schema as JSONSchema7 | undefined;
  if (s?.type !== "array") return false;
  const items = s.items as JSONSchema7 | undefined;
  if (!items || typeof items === "boolean") return false;
  return (
    items.type === "string" &&
    items.format === "uri" &&
    typeof items.contentMediaType === "string" &&
    items.contentMediaType.startsWith("image/")
  );
});
