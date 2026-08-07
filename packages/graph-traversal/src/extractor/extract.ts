import type { DatasetCore } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import ds from "@rdfjs/data-model";
import clownface from "clownface";
import type { ExtendedWalkerOptions, Logger } from "@graviola/edb-core-types";
import {
  buildTraversalSchema,
  type TraversalSchema,
} from "../traversal-schema";
import type { ExtractionContext } from "./types";
import { createNoOpLogger } from "@graviola/edb-core-utils";
import { extractObject } from "./extractObject";

/**
 * Extracts data from an RDF graph according to a JSON Schema
 *
 * This is the main entry point for the new extractor implementation.
 * It builds a traversal schema if needed (dereference + project), then uses
 * that structure to guide extraction from the graph.
 *
 * Key improvements over the legacy implementation:
 * - Uses traversal schemas (no `$ref` resolution during extraction)
 * - Cleaner separation of concerns with dedicated extractor functions
 * - Better handling of anyOf/oneOf patterns
 * - Structured logging support
 * - Depth control via schema structure (no infinite loops)
 *
 * @template T - The type to derive filter patterns from (typically z.infer<typeof zodSchema>)
 * @param iri The IRI of the entity to extract
 * @param dataset The RDF dataset to extract from
 * @param schema The JSON Schema defining the structure to extract
 * @param options Walker options including filter options (select/include/omit)
 * @param baseIRI Optional base IRI for expanding property names (defaults to "http://schema.org/")
 * @param context Optional prefix mappings for property name expansion
 * @param logger Optional logger for debugging (defaults to no-op)
 * @returns The extracted data as a JavaScript object
 *
 * @example
 * ```typescript
 * // Without type parameter (backward compatible)
 * const result = extractFromGraph(
 *   "http://example.com/person1",
 *   dataset,
 *   personSchema,
 *   {
 *     includeRelationsByDefault: false,
 *     include: { friends: { take: 10 } },
 *     omit: ["internalId"],
 *   },
 *   "http://schema.org/",
 *   { dc: "http://purl.org/dc/elements/1.1/" }
 * );
 *
 * // With Zod type inference for type safety
 * import { z } from 'zod';
 * const zodSchema = z.object({
 *   name: z.string(),
 *   friends: z.array(z.object({ name: z.string() }))
 * });
 * type Person = z.infer<typeof zodSchema>;
 *
 * const result2 = extractFromGraph<Person>(
 *   "http://example.com/person1",
 *   dataset,
 *   personSchema,
 *   {
 *     include: { friends: { take: 10 } } // Type-safe: only valid keys allowed
 *   }
 * );
 * ```
 */
export function extractFromGraph<T = any>(
  iri: string,
  dataset: DatasetCore,
  schema: JSONSchema7,
  options: Partial<ExtendedWalkerOptions<T>> = {},
  baseIRI: string = "http://schema.org/",
  context?: Record<string, string>,
  logger?: Logger,
): any {
  const log = logger || createNoOpLogger();

  log.info("Starting graph extraction", { iri, depth: 0 });

  // Build the traversal schema if not already prepared
  let traversal: TraversalSchema;
  if ((schema as any)._traversalSchema) {
    traversal = schema as TraversalSchema;
    log.debug("Schema already prepared for traversal");
  } else {
    log.debug("Building traversal schema");
    traversal = buildTraversalSchema(schema, options);
  }

  // Create the extraction context
  const ctx: ExtractionContext = {
    baseIRI,
    dataset,
    traversalSchema: traversal,
    options,
    context,
    depth: 0,
    logger: log,
  };

  // Create clownface pointer for the start node
  const cf = clownface({ dataset });
  const startNode = cf.node(ds.namedNode(iri));

  // Extract using the traversal schema
  const result = extractObject(startNode as any, traversal, ctx);

  log.info("Graph extraction complete", {
    iri,
    hasResult: result !== undefined,
  });

  return result;
}
