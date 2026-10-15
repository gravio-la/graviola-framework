import { stripClientMetaFromDocument } from "@graviola/meta-schema";
import {
  bringDefinitionToTop,
  stripXCalcProperties,
} from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

export type PrepareEntityForPersistOptions = {
  adbSchema?: JSONSchema7;
  typeName?: string;
};

/**
 * Normalizes entity JSON before {@link CrudDatastoreStore.upsert}: strips
 * client-roundtripped `$meta` (system-asserted only) and calculated fields.
 */
export function prepareEntityForPersist(
  data: Record<string, unknown>,
  options?: PrepareEntityForPersistOptions,
): Record<string, unknown> {
  let persistData = data;
  if (options?.adbSchema && options?.typeName) {
    const typeSchema = bringDefinitionToTop(
      options.adbSchema,
      options.typeName,
    ) as JSONSchema7;
    persistData = stripXCalcProperties(persistData, typeSchema);
  }
  return stripClientMetaFromDocument(persistData);
}
