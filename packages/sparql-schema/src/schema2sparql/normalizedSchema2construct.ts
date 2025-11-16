/**
 * New safe SPARQL CONSTRUCT query builder that operates on normalized schemas
 *
 * Key features:
 * - Works on normalized schemas (all $refs resolved)
 * - Uses @tpluscode/sparql-builder for safe query construction
 * - Prevents injection attacks through proper escaping
 * - Supports pagination with query-stage marking
 * - Cache-friendly design (normalized schemas can be reused)
 */

import {
  sparql,
  SparqlTemplateResult,
  SELECT,
} from "@tpluscode/sparql-builder";
import { JSONSchema7 } from "json-schema";
import { isJSONSchema } from "@graviola/json-schema-utils";
import type { NormalizedSchema } from "@graviola/edb-graph-traversal";
import type {
  Prefixes,
  OrderByClause,
  SortOrder,
  PaginationMetadata,
} from "@graviola/edb-core-types";
import df from "@rdfjs/data-model";

/**
 * Result of CONSTRUCT query generation
 */
export type ConstructResult = {
  /** CONSTRUCT clause patterns */
  constructPatterns: SparqlTemplateResult[];
  /** WHERE clause patterns */
  wherePatterns: SparqlTemplateResult[];
  /**
   * Pagination metadata for arrays with source marked as "query"
   * This indicates pagination was applied at the SPARQL query stage
   */
  paginationMetadata: Map<string, PaginationMetadata & { source: "query" }>;
};

/**
 * Helper function to create an OPTIONAL WHERE pattern
 * Makes code more readable by clearly indicating optional patterns
 */
function createOptionalWherePattern(
  pattern: SparqlTemplateResult,
): SparqlTemplateResult {
  return sparql`OPTIONAL { ${pattern} }`;
}

/**
 * Helper function to create a required WHERE pattern
 * For consistency with createOptionalWherePattern, though this is just a pass-through
 */
function createRequiredWherePattern(
  pattern: SparqlTemplateResult,
): SparqlTemplateResult {
  return pattern;
}

/**
 * Helper function to add a pattern to WHERE clause based on whether it's required
 */
function addWherePattern(
  wherePatterns: SparqlTemplateResult[],
  pattern: SparqlTemplateResult,
  isRequired: boolean,
): void {
  wherePatterns.push(
    isRequired
      ? createRequiredWherePattern(pattern)
      : createOptionalWherePattern(pattern),
  );
}

/**
 * Normalize orderBy to array format
 * Converts single object or array of objects to consistent array format
 * Example: { name: 'asc' } => [{ name: 'asc' }]
 */
function normalizeOrderBy(
  orderBy: OrderByClause | OrderByClause[] | undefined,
): OrderByClause[] {
  if (!orderBy) {
    return [];
  }
  return Array.isArray(orderBy) ? orderBy : [orderBy];
}

/**
 * Check if pagination has orderBy specified
 * Important: For blank nodes (unnamed nodes), orderBy is required for consistent pagination
 */
function hasOrderBy(paginationMeta: any): boolean {
  return paginationMeta && paginationMeta.orderBy !== undefined;
}

/**
 * Create a paginated SUBSELECT with ORDER BY for array relationships
 *
 * Uses the SPARQL query builder's SELECT to build a proper SUBSELECT.
 * The SUBSELECT:
 * 1. Selects the array items with proper ordering
 * 2. Applies LIMIT and OFFSET for pagination
 * 3. Includes necessary properties for ORDER BY
 *
 * Example output:
 * {
 *   SELECT ?friend WHERE {
 *     <subject> :friends ?friend .
 *     OPTIONAL { ?friend :name ?name }
 *   }
 *   ORDER BY ?name
 *   LIMIT 10
 *   OFFSET 5
 * }
 *
 * @param subject - The subject node
 * @param predicate - The property predicate
 * @param objectVar - Variable for the array items
 * @param itemSchema - Schema for array items
 * @param paginationMeta - Pagination metadata with orderBy, take, skip
 * @param prefixMap - Prefix mappings
 * @param depth - Current recursion depth
 * @returns SPARQL SUBSELECT query using SELECT builder
 */
function createPaginatedSubselect(
  subject: any,
  predicate: any,
  objectVar: any,
  itemSchema: JSONSchema7,
  paginationMeta: any,
  prefixMap: Prefixes,
  depth: number,
): SparqlTemplateResult {
  // Start with SELECT builder - select the object variable (dots required by SPARQL syntax)
  let query = SELECT`${objectVar}`
    .WHERE`${subject} ${predicate} ${objectVar} .`;

  // Add OPTIONAL patterns for ORDER BY properties
  if (paginationMeta.orderBy) {
    const normalized = normalizeOrderBy(paginationMeta.orderBy);

    for (const clause of normalized) {
      for (const property of Object.keys(clause)) {
        const propPredicate = createPredicate(property, prefixMap);
        const propVarName = sanitizeVariableName(property);
        const propVar = df.variable(propVarName);

        // Add OPTIONAL pattern for ORDER BY property (dots required by SPARQL syntax)
        query = query.WHERE`OPTIONAL { ${objectVar} ${propPredicate} ${propVar} . }`;
      }
    }
  }

  // Apply ORDER BY if specified
  if (paginationMeta.orderBy) {
    const normalized = normalizeOrderBy(paginationMeta.orderBy);
    let orderBuilder = query.ORDER();

    for (let i = 0; i < normalized.length; i++) {
      const clause = normalized[i];
      for (const [property, order] of Object.entries(clause)) {
        if (!order) continue;

        const propVarName = sanitizeVariableName(property);
        const propVar = df.variable(propVarName);
        const isDesc = order === "desc";

        if (i === 0 && Object.keys(clause).indexOf(property) === 0) {
          // First ORDER BY
          query = orderBuilder.BY(propVar, isDesc);
        } else {
          // Subsequent ORDER BY (use THEN)
          query = (query as any).THEN.BY(propVar, isDesc);
        }
      }
    }
  }

  // Apply LIMIT if specified
  if (paginationMeta.take !== undefined) {
    query = query.LIMIT(paginationMeta.take);
  }

  // Apply OFFSET if specified
  if (paginationMeta.skip !== undefined && paginationMeta.skip > 0) {
    query = query.OFFSET(paginationMeta.skip);
  }

  // Return the query - when used in a WHERE clause, it will automatically be wrapped in { }
  return query as any as SparqlTemplateResult;
}

/**
 * Generate SPARQL CONSTRUCT query from a normalized schema
 *
 * @param subjectIRI - The IRI of the subject to construct
 * @param normalizedSchema - Schema with all $refs resolved
 * @param options - Optional configuration
 * @returns CONSTRUCT and WHERE patterns with metadata
 */
export function normalizedSchema2construct(
  subjectIRI: string,
  normalizedSchema: NormalizedSchema,
  options?: {
    excludedProperties?: string[];
    maxRecursion?: number;
    prefixMap?: Prefixes; // Prefix mappings (e.g., { "foaf": "http://xmlns.com/foaf/0.1/" })
  },
): ConstructResult {
  // Always exclude JSON-LD metadata properties (starting with @)
  const userExcluded = options?.excludedProperties || [];
  const excludedProperties = userExcluded;
  const maxRecursion = options?.maxRecursion || 4;
  const prefixMap = options?.prefixMap || {};

  const constructPatterns: SparqlTemplateResult[] = [];
  const wherePatterns: SparqlTemplateResult[] = [];
  const paginationMetadata = new Map<
    string,
    {
      skip?: number;
      take?: number;
      orderBy?: OrderByClause | OrderByClause[];
      source: "query";
    }
  >();

  // Create subject node
  const subject = df.namedNode(subjectIRI);

  // Add rdf:type pattern (always OPTIONAL)
  const typeVar = df.variable("type");
  const rdfType = df.namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  );

  // Use sparql builder to create patterns (dots required by SPARQL syntax)
  const typePattern = sparql`${subject} ${rdfType} ${typeVar} .`;
  constructPatterns.push(typePattern);
  addWherePattern(wherePatterns, typePattern, false); // rdf:type is always optional

  // Walk through schema properties
  if (normalizedSchema.properties) {
    Object.entries(normalizedSchema.properties).forEach(
      ([propertyName, propertySchema]) => {
        // Skip explicitly excluded properties
        // Note: JSON-LD metadata properties (@id, @type, etc.) should already be
        // filtered out during schema normalization (via excludeJsonLdMetadata flag)
        if (excludedProperties.includes(propertyName)) {
          return;
        }

        if (!isJSONSchema(propertySchema)) {
          return; // Skip boolean schemas
        }

        // Create property patterns
        const propertyPatterns = createPropertyPatterns(
          subject,
          propertyName,
          propertySchema as JSONSchema7,
          normalizedSchema,
          0,
          maxRecursion,
          prefixMap,
        );

        constructPatterns.push(...propertyPatterns.construct);
        wherePatterns.push(...propertyPatterns.where);

        // Collect pagination metadata if present
        if (propertyPatterns.pagination) {
          // Mark with source: "query" to tell extractor not to paginate again
          paginationMetadata.set(propertyName, {
            ...propertyPatterns.pagination,
            source: "query", // Critical: prevents double-pagination!
          });
        }
      },
    );
  }

  return {
    constructPatterns,
    wherePatterns,
    paginationMetadata,
  };
}

/**
 * Create SPARQL patterns for a single property
 */
function createPropertyPatterns(
  subject: any,
  propertyName: string,
  propertySchema: JSONSchema7,
  normalizedSchema: NormalizedSchema,
  depth: number,
  maxRecursion: number,
  prefixMap: Prefixes,
): {
  construct: SparqlTemplateResult[];
  where: SparqlTemplateResult[];
  pagination?: any;
} {
  const construct: SparqlTemplateResult[] = [];
  const where: SparqlTemplateResult[] = [];

  // Stop if max recursion reached
  if (depth > maxRecursion) {
    return { construct, where };
  }

  // Create predicate (property name)
  // Handle prefixed names (e.g., "dc:title") and full IRIs
  const predicate = createPredicate(propertyName, prefixMap);

  // Create object variable (use property name as basis + depth for uniqueness)
  const varName = `${sanitizeVariableName(propertyName)}_${depth}`;
  const objectVar = df.variable(varName);

  // Create triple patterns (dots required by SPARQL syntax)
  const triplePattern = sparql`${subject} ${predicate} ${objectVar} .`;

  construct.push(triplePattern);

  // Handle different property types
  if (propertySchema.type === "array" && propertySchema.items) {
    // Check for pagination metadata in the array schema
    // Normalizer adds x-pagination to array properties when include patterns specify pagination
    const paginationMeta = (propertySchema as any)["x-pagination"];

    // Handle array items
    const itemSchema = Array.isArray(propertySchema.items)
      ? propertySchema.items[0]
      : propertySchema.items;

    // Check if we need a SUBSELECT for pagination with ORDER BY
    const needsSubselect =
      paginationMeta &&
      (paginationMeta.take !== undefined || hasOrderBy(paginationMeta));

    if (needsSubselect) {
      // Use SUBSELECT for pagination with ORDER BY
      const subselect = createPaginatedSubselect(
        subject,
        predicate,
        objectVar,
        itemSchema as JSONSchema7,
        paginationMeta,
        prefixMap,
        depth,
      );

      // Add SUBSELECT to WHERE clause
      // SUBSELECT is always OPTIONAL for arrays (like all array relationships)
      addWherePattern(where, subselect, false);
    } else {
      // Regular pattern without pagination
      const isRequired =
        normalizedSchema.required?.includes(propertyName) || false;
      addWherePattern(where, triplePattern, isRequired);
    }

    if (
      typeof itemSchema !== "boolean" &&
      (itemSchema as JSONSchema7).type === "object"
    ) {
      // Array of objects - recurse into nested structure
      const nestedPatterns = handleNestedObject(
        objectVar,
        itemSchema as JSONSchema7,
        depth + 1,
        maxRecursion,
        prefixMap,
      );
      construct.push(...nestedPatterns.construct);
      where.push(...nestedPatterns.where);
    }
    // For array of primitives, no further recursion needed

    // Return pagination metadata for this property
    return { construct, where, pagination: paginationMeta };
  } else if (propertySchema.type === "object" && propertySchema.properties) {
    // Handle nested object - recurse into its properties
    // Add WHERE pattern for the object property first
    const isRequired =
      normalizedSchema.required?.includes(propertyName) || false;
    addWherePattern(where, triplePattern, isRequired);

    const nestedPatterns = handleNestedObject(
      objectVar,
      propertySchema,
      depth + 1,
      maxRecursion,
      prefixMap,
    );
    construct.push(...nestedPatterns.construct);
    where.push(...nestedPatterns.where);
  } else {
    // For primitive types (string, number, boolean), add WHERE pattern
    const isRequired =
      normalizedSchema.required?.includes(propertyName) || false;
    addWherePattern(where, triplePattern, isRequired);
  }

  return { construct, where };
}

/**
 * Handle nested object properties
 */
function handleNestedObject(
  subject: any,
  objectSchema: JSONSchema7,
  depth: number,
  maxRecursion: number,
  prefixMap: Prefixes,
): { construct: SparqlTemplateResult[]; where: SparqlTemplateResult[] } {
  const construct: SparqlTemplateResult[] = [];
  const where: SparqlTemplateResult[] = [];

  // Stop if max recursion reached
  if (depth > maxRecursion) {
    return { construct, where };
  }

  // Add type pattern for nested object
  const typeVar = df.variable(`type_${depth}`);
  const rdfType = df.namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  );

  const nestedTypePattern = sparql`${subject} ${rdfType} ${typeVar} .`;
  construct.push(nestedTypePattern);
  addWherePattern(where, nestedTypePattern, false); // rdf:type is always optional

  // Create a minimal NormalizedSchema for nested property processing
  // This allows createPropertyPatterns to check for required properties
  const nestedNormalizedSchema: NormalizedSchema = {
    ...objectSchema,
    _normalized: true,
    _propertyMetadata: {},
  };

  // Walk through nested properties
  if (objectSchema.properties) {
    Object.entries(objectSchema.properties).forEach(
      ([nestedPropName, nestedPropSchema]) => {
        // Note: JSON-LD metadata properties should already be filtered during normalization
        if (!isJSONSchema(nestedPropSchema)) {
          return; // Skip boolean schemas
        }

        // Use createPropertyPatterns to handle all property types (including arrays with pagination)
        const nestedPatterns = createPropertyPatterns(
          subject,
          nestedPropName,
          nestedPropSchema as JSONSchema7,
          nestedNormalizedSchema,
          depth,
          maxRecursion,
          prefixMap,
        );

        construct.push(...nestedPatterns.construct);
        where.push(...nestedPatterns.where);
      },
    );
  }

  return { construct, where };
}

/**
 * Create a predicate node from a property name
 *
 * Logic:
 * - No colon: treat as local name with default prefix (:name)
 * - Has colon: check if prefix is in prefixMap
 *   - If in prefixMap: leave as-is (will be resolved by PREFIX declarations)
 *   - Otherwise: treat as full URL and wrap in angle brackets (e.g., <urn:x121>)
 *
 * @param propertyName - The property name from the schema
 * @param prefixMap - Prefix mappings (e.g., { "foaf": "http://xmlns.com/foaf/0.1/" })
 * @returns Predicate for SPARQL pattern
 */
function createPredicate(propertyName: string, prefixMap: Prefixes): any {
  // No colon: treat as local name with default prefix
  if (!propertyName.includes(":")) {
    return `:${propertyName}`;
  }

  // Has colon: split to check prefix
  const colonIndex = propertyName.indexOf(":");
  const prefix = propertyName.substring(0, colonIndex);

  // Check if prefix is in prefixMap
  if (prefixMap[prefix]) {
    // Prefix is registered, leave as-is (e.g., "foaf:name")
    // SPARQL engine will resolve using PREFIX declarations
    return propertyName;
  }

  // Prefix not in prefixMap: treat as full URL
  // Examples: urn:x121, http://example.com/prop, https://schema.org/name
  return df.namedNode(propertyName);
}

/**
 * Sanitize variable name to be valid in SPARQL
 * Only allow alphanumeric and underscore
 */
function sanitizeVariableName(name: string): string {
  // Remove any characters that aren't alphanumeric or underscore
  // Replace colons and other special chars with underscore
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}
