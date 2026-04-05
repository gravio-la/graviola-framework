import type {
  SPARQLCRUDLogger,
  SPARQLQueryType,
} from "@graviola/edb-core-types";

/**
 * Correlating TanStack Query keys with SPARQL log lines:
 * - Tier A: semantic `queryKey` on datastore paths (see `initSPARQLStore`, `sparql-schema/load`).
 * - Tier B: pass `queryKey` through more `sparql-schema` call sites.
 * - Tier C: wrap `queryFn` with `runWithSparqlQueryKey` from `@graviola/edb-core-utils` (single-slot; parallel queries may mis-attribute).
 * - Tier D: optional metadata on `AbstractDatastore` methods — only if you need strict parallelism.
 */

export type SparqlQueryLogEntry = {
  id: string;
  timestamp: number;
  queryKey?: string;
  query: string;
  queryType: SPARQLQueryType;
  durationMs: number;
  error?: string;
};

const DEFAULT_MAX = 500;

let enabled = false;
let maxEntries = DEFAULT_MAX;
let entries: SparqlQueryLogEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeSparqlQueryLog(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getSparqlQueryLogSnapshot(): SparqlQueryLogEntry[] {
  return entries;
}

export function getServerSparqlQueryLogSnapshot(): SparqlQueryLogEntry[] {
  return [];
}

/** When devtools mount, logging is recorded; when they unmount, recording stops (entries stay until cleared). */
export function setSparqlQueryLoggingEnabled(value: boolean) {
  enabled = value;
  emit();
}

export function setSparqlQueryLogMaxEntries(n: number) {
  maxEntries = Math.max(1, n);
  if (entries.length > maxEntries) {
    entries = entries.slice(-maxEntries);
    emit();
  }
}

export function clearSparqlQueryLog() {
  entries = [];
  emit();
}

/**
 * Stable `logQuery` implementation for `SparqlEndpoint & SPARQLCRUDLogger`.
 * Pair with `sparqlLoggingWrapper` from `@graviola/edb-core-utils` on CRUD functions.
 */
export const sparqlDevtoolsLogQuery: NonNullable<
  SPARQLCRUDLogger["logQuery"]
> = (queryKey, query, queryType, meta) => {
  if (!enabled) return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: SparqlQueryLogEntry = {
    id,
    timestamp: Date.now(),
    queryKey,
    query,
    queryType,
    durationMs: meta?.durationMs ?? 0,
    error:
      meta?.error !== undefined
        ? meta.error instanceof Error
          ? meta.error.message
          : String(meta.error)
        : undefined,
  };
  entries = [...entries, entry].slice(-maxEntries);
  emit();
};
