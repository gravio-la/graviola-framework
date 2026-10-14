import type { JSONSchema7 } from "json-schema";
import get from "lodash-es/get";

/** Resolve JSON Schema for the primary description field from side-schema primaryFields. */
export function schemaForPrimaryDescription(
  rootSchema: JSONSchema7,
  descriptionPath: string | undefined,
): JSONSchema7 | undefined {
  if (!descriptionPath) return undefined;
  const top = descriptionPath.split(".")[0];
  if (!top) return undefined;
  const prop = get(rootSchema, ["properties", top]) as JSONSchema7 | undefined;
  return prop;
}
