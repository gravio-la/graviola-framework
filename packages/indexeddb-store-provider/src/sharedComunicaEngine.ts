import { QueryEngine } from "@comunica/query-sparql-rdfjs";

let sharedEngine: QueryEngine | null = null;

/** Stateless QueryEngine — safe to share across store providers */
export function getSharedComunicaEngine(): QueryEngine {
  if (!sharedEngine) {
    sharedEngine = new QueryEngine();
  }
  return sharedEngine;
}
