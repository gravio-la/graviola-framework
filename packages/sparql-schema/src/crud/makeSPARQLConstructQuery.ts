import { SPARQLCRUDOptions } from "@graviola/edb-core-types";
import { buildTraversalSchema } from "@graviola/edb-graph-traversal";
import { JSONSchemaWithInverseProperties } from "@graviola/json-schema-utils";

import { traversalSchema2construct } from "@/schema2sparql/traversalSchema2construct";
import { buildSPARQLConstructQuery } from "@/schema2sparql/buildSPARQLConstructQuery";

/**
 * Generates a SPARQL CONSTRUCT query from a JSON Schema
 *
 * @deprecated Consider using traversalSchema2construct + buildCompleteSPARQLQuery directly for more control
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

  // Build the traversal schema first
  // Note: maxRecursion is handled internally by buildTraversalSchema during ref resolution
  const traversal = buildTraversalSchema(schema, {
    includeRelationsByDefault: true,
  });

  // Generate SPARQL patterns using new implementation
  const constructResult = traversalSchema2construct(
    entityIRI,
    typeIRI,
    traversal,
    {
      prefixMap,
      resolveInverseMaxDepth: options.resolveInverseMaxDepth,
      maxRecursion: options.maxRecursion,
    },
  );

  // Build complete query
  return buildSPARQLConstructQuery(constructResult, prefixMap);
};
