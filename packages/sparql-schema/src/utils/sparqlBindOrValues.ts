import type { Variable } from "@rdfjs/types";
import { SPARQLFlavour, type Prefixes } from "@graviola/edb-core-types";
import { sparql, type SparqlTemplateResult } from "@tpluscode/sparql-builder";
import { convertIRIToNode } from "./iriConverter";

type BindOrValuesOptions = {
  useBind?: boolean;
  flavour?: SPARQLFlavour;
  prefixMap?: Prefixes;
};

/**
 * Creates a SPARQL pattern that binds entity IRI(s) to a variable using either BIND or VALUES clause.
 *
 * Uses BIND for single entities when targeting Oxigraph (better performance).
 * Uses VALUES for multiple entities or other SPARQL engines (avoids SP031 error in Virtuoso).
 *
 * Supports both full IRIs and prefixed names (e.g., "schema:Person" or "http://schema.org/Person").
 *
 * @param entityIRI - Single IRI or array of IRIs to bind (can be full IRIs or prefixed names)
 * @param variable - RDF Variable to bind the IRI(s) to
 * @param options - Configuration for BIND vs VALUES behavior and prefix mappings
 * @returns SparqlTemplateResult pattern that can be composed with other sparql-builder patterns
 *
 * @example
 * ```typescript
 * import { variable } from '@rdfjs/data-model';
 * import { sparql } from '@tpluscode/sparql-builder';
 *
 * // Single entity with BIND (Oxigraph) - full IRI
 * const pattern = createBindOrValuesPattern(
 *   'http://example.org/entity1',
 *   variable('subject'),
 *   { flavour: 'oxigraph' }
 * );
 *
 * // With prefixed name
 * const pattern2 = createBindOrValuesPattern(
 *   'ex:entity1',
 *   variable('subject'),
 *   {
 *     flavour: 'oxigraph',
 *     prefixMap: { 'ex': 'http://example.org/' }
 *   }
 * );
 *
 * // Multiple entities with VALUES
 * const pattern3 = createBindOrValuesPattern(
 *   ['http://example.org/entity1', 'http://example.org/entity2'],
 *   variable('subject')
 * );
 *
 * // Compose with other patterns
 * const typePattern = sparql`${variable('subject')} a <http://schema.org/Person> .`;
 * // Can be combined in WHERE clauses
 * ```
 */
export const createBindOrValuesPattern = (
  entityIRI: string | string[],
  variable: Variable,
  options?: BindOrValuesOptions,
): SparqlTemplateResult => {
  const entityIRIList = Array.isArray(entityIRI) ? entityIRI : [entityIRI];

  if (entityIRIList.length === 0) {
    throw new Error("entityIRIList is empty, would result in invalid SPARQL");
  }

  // Convert string IRIs to RDF nodes (handles prefixed names and full IRIs)
  const prefixMap = options?.prefixMap || {};
  const entityNodes = entityIRIList.map((iri) =>
    convertIRIToNode(iri, prefixMap),
  );

  // Determine whether to use BIND or VALUES based on flavour and options
  const shouldUseBind = options?.useBind ?? options?.flavour === "oxigraph";

  if (entityNodes.length === 1 && shouldUseBind) {
    // Use BIND for single entity IRI (better performance for Oxigraph)
    return sparql`BIND(${entityNodes[0]} AS ${variable}) .`;
  } else {
    // Use VALUES for multiple entity IRIs or when flavour is not oxigraph
    // VALUES avoids SP031 error in Virtuoso and works well for all implementations
    // Build VALUES pattern: VALUES ?var { <iri1> <iri2> ... }
    return sparql`VALUES ${variable} { ${entityNodes} }`;
  }
};
