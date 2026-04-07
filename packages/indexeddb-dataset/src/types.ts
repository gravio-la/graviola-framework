import type { NamedNode, BlankNode, Literal, DefaultGraph } from "@rdfjs/types";

/**
 * RDF term positions for quads persisted in this store: classic RDF 1.1
 * (IRIs, blank nodes, literals, default or named graphs)
 */
export type StoredQuadSubject = NamedNode | BlankNode;
export type StoredQuadPredicate = NamedNode;
export type StoredQuadObject = NamedNode | BlankNode | Literal;
export type StoredQuadGraph = NamedNode | BlankNode | DefaultGraph;

/**
 * Internal types for the IndexedDB hexastore layout.
 *
 * The database has four object stores:
 *   - "terms": bidirectional dictionary mapping RDF term strings to integer IDs
 *   - "spo": compound key [s,p,o,g] — subject-primary index
 *   - "ops": compound key [o,p,s,g] — object-primary (inverse) index
 *   - "pso": compound key [p,s,o,g] — predicate-primary index
 *
 * Each index store contains only compound keys (no value payload).
 * Existence in the index equals existence of the quad.
 */

/** A record in the "terms" object store */
export type TermRecord = {
  /** Auto-incremented integer primary key */
  id: number;
  /**
   * Canonical N-Triples serialization of the RDF term:
   *   Named node:  <http://example.org/foo>
   *   Blank node:  _:b0
   *   Literal:     "hello"@en  or  "42"^^<http://www.w3.org/2001/XMLSchema#integer>
   *   Default graph: ""  (empty string — sentinel value)
   */
  term: string;
};

/** Integer IDs for the four components of a quad */
export type QuadIds = {
  s: number;
  p: number;
  o: number;
  g: number;
};

/** The three index permutations we maintain */
export type IndexName = "spo" | "ops" | "pso";

/** Which components of a quad pattern are bound (non-wildcard) */
export type BoundPattern = {
  s?: number;
  p?: number;
  o?: number;
  g?: number;
};

/** Database schema version */
export const DB_VERSION = 1;

/** Name of the terms dictionary object store */
export const TERMS_STORE = "terms";

/** Name of the index on the term string (unique) */
export const TERMS_BY_TERM_INDEX = "by_term";

/** Names of the three index stores */
export const INDEX_STORES: IndexName[] = ["spo", "ops", "pso"];

/** Default IndexedDB database name */
export const DEFAULT_DB_NAME = "graviola-rdf";

/** Default write buffer flush threshold (number of pending quads) */
export const DEFAULT_FLUSH_THRESHOLD = 100;

/** Default write buffer flush interval in milliseconds */
export const DEFAULT_FLUSH_INTERVAL_MS = 50;
