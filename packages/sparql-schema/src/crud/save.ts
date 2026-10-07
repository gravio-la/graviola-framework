import {
  NamedAndTypedEntity,
  SPARQLCRUDOptions,
} from "@graviola/edb-core-types";
import { assertSafeIri } from "@graviola/edb-core-utils";
import {
  dataset2NTriples,
  jsonld2DataSet,
  removeInversePropertiesFromSchema,
} from "@graviola/jsonld-utils";
import df from "@rdfjs/data-model";
import { sparql } from "@tpluscode/rdf-string";
import { DELETE, INSERT } from "@tpluscode/sparql-builder";
import { JSONSchema7 } from "json-schema";

import {
  makeSPARQLWherePart,
  withDefaultPrefix,
  withGraph,
} from "./makeSPARQLWherePart";
import { jsonSchema2construct } from "@/schema2sparql";

type SaveOptions = SPARQLCRUDOptions & {
  /** Only insert; the stored state of the entity is not removed first. */
  skipRemove?: boolean;
};

/**
 * Writes one entity to a SPARQL store as a single update request.
 *
 * The request holds two operations that the store runs in one transaction:
 *
 * 1. a `DELETE … WHERE` that removes the stored state of the entity: its own
 *    triples as far as `schema` describes them, and the anonymous (blank node)
 *    objects it owns. Named entities it links to are left alone. The WHERE is
 *    OPTIONAL, so the request also works for an entity that is not stored yet.
 * 2. an `INSERT DATA` with every triple of `dataToBeSaved`.
 *
 * With `skipRemove` only the second operation is sent. With
 * `defaultUpdateGraph` both operations address that named graph, otherwise the
 * default graph.
 *
 * ## What save guarantees
 *
 * The document cannot change the structure of the update, whatever it
 * contains: values only ever become RDF terms, and a document that would
 * produce an invalid term is refused. In detail, save throws if
 *
 * - an IRI, a datatype or a language tag is invalid, or a key is not mapped by
 *   the `@context` (the document is converted in strict mode),
 * - the `@context` is given as a URL (it is never fetched),
 * - the document addresses a named graph of its own through `@graph`,
 * - `@id`, `@type` or `defaultUpdateGraph` is not a safe absolute IRI.
 *
 * Blank node labels of the document are replaced by generated ones.
 *
 * ## What the caller has to ensure
 *
 * save inserts **every** triple the document expands to. It does not restrict
 * them to the entity being saved:
 *
 * - a nested object with an `@id` of its own writes triples about that other
 *   entity, e.g. `{ "@id": "…/other", "isAdmin": true }`;
 * - `@reverse` writes triples whose subject is another entity;
 * - a property the schema does not know is written as well.
 *
 * None of these are removed by the DELETE of a later save, which only covers
 * the entity's own schema-described triples.
 *
 * This is deliberately left to the caller. Which nested entities belong to a
 * write is a decision about the data model, and save has no basis for it:
 * writing a linked entity together with its parent is wanted in some places
 * (bulk imports with `skipRemove`) and unwanted in others (a form save, where
 * a linked entity must only be referenced). Whether a client may write to an
 * entity at all is an authorization question that is outside this package.
 *
 * A caller that takes documents from an untrusted source must therefore shape
 * them first — `cleanJSONLD` from `@graviola/jsonld-utils` with
 * `pruneLinkedDocuments` reduces a document to what the schema describes and
 * turns linked entities into references; the SPARQL store implementation does
 * this before every save.
 *
 * @param dataToBeSaved the JSON-LD document, with `@id`, `@type` and an inline
 *   `@context` that maps all of its keys
 * @param schema JSON Schema of the entity; determines what the DELETE removes
 * @param updateFetch sends the SPARQL update to the store
 * @param options prefix, target graph, query build options, and optional
 *   `maxRecursion` for the DELETE (same depth as {@link makeSPARQLDeleteQuery})
 * @returns whatever `updateFetch` resolves to
 * @throws if the document is refused (see above) or the store rejects the update
 */
export const save = async (
  dataToBeSaved: NamedAndTypedEntity,
  schema: JSONSchema7,
  updateFetch: (query: string) => Promise<any>,
  options: SaveOptions,
) => {
  const { skipRemove, queryBuildOptions, defaultPrefix } = options;
  const entityIRI = dataToBeSaved["@id"];
  const typeIRI = dataToBeSaved["@type"];
  const ds = await jsonld2DataSet(dataToBeSaved);
  // The target graph is the caller's choice (defaultUpdateGraph), never the
  // document's.
  for (const quad of ds) {
    if (quad.graph.termType !== "DefaultGraph") {
      throw new Error(
        "The document addresses a named graph (@graph); save only writes to the configured graph",
      );
    }
  }
  const cleanSchema = removeInversePropertiesFromSchema(schema);

  // The data is serialized as N-Triples, every IRI written out in full. Handing
  // the dataset to the builder as RDF terms is not an option: it abbreviates
  // IRIs of well-known namespaces to prefixed names without escaping the local
  // part, so `http://schema.org/o;schema:role'admin'` would become a second
  // triple. INSERT DATA takes no WITH clause; a named graph is addressed
  // inside the data block.
  const ntriples = await dataset2NTriples(ds);
  const insertData = options.defaultUpdateGraph
    ? INSERT.DATA`GRAPH ${df.namedNode(assertSafeIri(options.defaultUpdateGraph))} { ${ntriples} }`
    : INSERT.DATA`${ntriples}`;

  if (skipRemove) {
    return await updateFetch(
      withDefaultPrefix(defaultPrefix, insertData.build(queryBuildOptions)),
    );
  }

  // Get the construct and where parts needed for the DELETE operation
  const { construct, whereRequired, whereOptionals } = jsonSchema2construct(
    entityIRI,
    cleanSchema,
    ["@id"],
    ["@id", "@type"],
    options.maxRecursion,
  );

  // Two operations in one update request (one transaction): remove the old
  // state, then insert the new one. They must not share a WHERE clause: an
  // INSERT template is instantiated once per solution, and the solutions are
  // the cross product of every multi-valued property of the stored entity.
  // Blank nodes in the template (statement sidecars, anonymous nested
  // objects) are minted afresh for each one, so a combined DELETE/INSERT
  // multiplied them on every save.
  const deleteQuery = DELETE` ${construct} `
    .WHERE`OPTIONAL { ${makeSPARQLWherePart(entityIRI, typeIRI, "?subject", { flavour: options.queryBuildOptions?.sparqlFlavour })} ${whereRequired}\n${whereOptionals} }`;

  const builtQuery = withDefaultPrefix(
    defaultPrefix,
    sparql`${withGraph(options.defaultUpdateGraph, deleteQuery)} ;\n${insertData}`.toString(
      queryBuildOptions,
    ),
  );

  try {
    return await updateFetch(builtQuery);
  } catch (e) {
    throw new Error("Failed to save data - DELETE/INSERT operation failed", {
      cause: e,
    });
  }
};
