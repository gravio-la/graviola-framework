/**
 * Local RDF blob persistence (N-Quads; default: localStorage). Turtle is not
 * used for dump because named-graph stores require a dataset-capable syntax.
 * A future IndexedDB or per-triple backend can implement {@link GraphBlobStorage}
 * without changing {@link LocalPersistenceOptions}.
 */

export type LocalPersistenceOptions = {
  enabled: boolean;
  restoreOnLoad: boolean;
  debounceMS: number;
  /** Isolates this graph — e.g. different dev scenarios or app variants */
  storageKey: string;
};

/** Prefix applied so keys do not collide with unrelated app data */
export const LOCAL_OXIGRAPH_STORAGE_PREFIX = "graviola:local-oxigraph:";

export function fullStorageKey(storageKey: string): string {
  return `${LOCAL_OXIGRAPH_STORAGE_PREFIX}${storageKey}`;
}

/** Minimal key/value blob API for serialized RDF (N-Quads) strings */
export type GraphBlobStorage = {
  get(key: string): string | null;
  set(key: string, value: string): void;
};

export function createLocalStorageGraphBlobStorage(): GraphBlobStorage {
  return {
    get(key: string) {
      if (typeof localStorage === "undefined") {
        return null;
      }
      return localStorage.getItem(key);
    },
    set(key: string, value: string) {
      if (typeof localStorage === "undefined") {
        return;
      }
      localStorage.setItem(key, value);
    },
  };
}

export function getPersistedTurtle(
  storage: GraphBlobStorage,
  fullKey: string,
): string | undefined {
  const v = storage.get(fullKey);
  if (v == null || v.trim() === "") {
    return undefined;
  }
  return v;
}

export function setPersistedTurtle(
  storage: GraphBlobStorage,
  fullKey: string,
  serialized: string,
): void {
  storage.set(fullKey, serialized);
}
