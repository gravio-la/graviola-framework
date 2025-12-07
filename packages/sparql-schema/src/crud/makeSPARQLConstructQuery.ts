import { SPARQLCRUDOptions } from "@graviola/edb-core-types";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { JSONSchemaWithInverseProperties } from "@graviola/json-schema-utils";

import { normalizedSchema2construct } from "@/schema2sparql/normalizedSchema2construct";
import { buildSPARQLConstructQuery } from "@/schema2sparql/buildSPARQLConstructQuery";

/**
 * Generates a SPARQL CONSTRUCT query from a JSON Schema
 *
 * @deprecated Consider using normalizedSchema2construct + buildCompleteSPARQLQuery directly for more control
 */
export const makeSPARQLConstructQuery = (
  entityIRI: string,
  typeIRI: string | undefined,
  schema: JSONSchemaWithInverseProperties,
  options: SPARQLCRUDOptions,
) => {
  const { defaultPrefix } = options;

  // Build prefix map from defaultPrefix
  const prefixMap = defaultPrefix ? { "": defaultPrefix } : {};

  // Normalize the schema first
  // Note: maxRecursion is handled internally by the normalizer during ref resolution
  const normalized = normalizeSchema(schema, {
    includeRelationsByDefault: true,
  });

  // Generate SPARQL patterns using new implementation
  const constructResult = normalizedSchema2construct(entityIRI, normalized, {
    prefixMap,
  });

  // Build complete query
  return buildSPARQLConstructQuery(constructResult, prefixMap);
};
