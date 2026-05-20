import { createContext, useContext } from "react";
import type { DatasetCore } from "@rdfjs/types";

/**
 * Live RDF quad source backing the paired {@link IndexedDBStoreProvider} /
 * {@link InMemoryStoreProvider}: same object Comunica uses for SPARQL, exposed
 * for cheap pattern `{@link DatasetCore.match}` / `matchAsync` scans (e.g. map overlays).
 *
 * Consumers must treat the reference as unstable across async work — only read
 * on the snapshot returned from your immediate query or after `enabled` guards.
 */
export const NativeRdfDatasetContext = createContext<DatasetCore | null>(null);

export function useNativeRdfDataset(): DatasetCore | null {
  return useContext(NativeRdfDatasetContext);
}
