import type { CapabilityDescriptor } from "./descriptor";
import type { EntityChangeEvent, ChangeListener, Unsubscribe } from "./events";
import type { StoreId } from "./ids";
import type { Identifies } from "./capabilities/identifies";
import type { Loads } from "./capabilities/loads";
import type { Lists } from "./capabilities/lists";
import type { Filters } from "./capabilities/filters";
import type { Searches } from "./capabilities/searches";
import type { Counts } from "./capabilities/counts";
import type { Writes } from "./capabilities/writes";
import type { Removes } from "./capabilities/removes";
import type { Streams } from "./capabilities/streams";
import type { FlatResultSet } from "./capabilities/flat-result-set";
import type { Imports } from "./capabilities/imports";
import type { TextSearches } from "./capabilities/text-searches";
import type { SpeaksNative } from "./capabilities/speaks-native";
import type { Resolves } from "./capabilities/resolves";
import type { Exists } from "./capabilities/exists";
import type { SchemaRegistry } from "./registry";

/**
 * Every Store exposes identity mapping, runtime capability flags, and optional change subscription.
 */
export type BaseStore<R extends SchemaRegistry = SchemaRegistry> =
  Identifies & {
    readonly storeId: StoreId;
    readonly capabilities: CapabilityDescriptor;
    /** Entity-scoped mutation events for cache invalidation */
    subscribe?(listener: ChangeListener<R>): Unsubscribe;
    /** Optional imperative emit hook used by adapter tests */
    emit?(event: EntityChangeEvent<R>): void;
  };

/**
 * Full capability intersection for SPARQL-backed stores (read/write, local Oxigraph, HTTP Fuseki/Blazegraph-class endpoints).
 * This is the reference shape implemented by `@graviola/sparql-db-impl` `initSPARQLStore`.
 */
export type SparqlStore<R extends SchemaRegistry> = BaseStore<R> &
  Loads<R> &
  Lists<R> &
  FlatResultSet<R> &
  Filters<R> &
  Searches<R> &
  Counts<R> &
  Writes<R> &
  Removes<R> &
  Streams<R> &
  Imports<R> &
  Resolves &
  Exists<R> &
  SpeaksNative<"sparql", unknown>;

/** Minimal read-mostly authority surface (e.g. Wikidata-shaped API). */
export type MinimalLookupStore<R extends SchemaRegistry> = BaseStore<R> &
  Loads<R> &
  Searches<R>;

/** Read-only structural access (e.g. HDT file) — no Writes/Removes. */
export type ReadOnlyStructuralStore<R extends SchemaRegistry> = BaseStore<R> &
  Loads<R> &
  Lists<R> &
  Filters<R> &
  Counts<R> &
  Resolves &
  Exists<R>;
