import Ajv from "ajv";
import type { SearchFacetSchema } from "./types";
import { searchFacetSchemaDefinition } from "./search-facet-schema-definition";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(searchFacetSchemaDefinition);

/**
 * Parse and validate a standalone search/facet configuration document (JSON).
 */
export function loadSearchFacetSchema(data: unknown): SearchFacetSchema {
  if (!validate(data)) {
    throw new Error(
      `Invalid search facet schema: ${ajv.errorsText(validate.errors)}`,
    );
  }
  return data as SearchFacetSchema;
}
