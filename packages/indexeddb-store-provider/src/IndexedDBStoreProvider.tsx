/**
 * IndexedDBStoreProvider — React context provider that mounts a persistent
 * IndexedDB-backed RDF store and wires it into the Graviola CRUD framework.
 *
 * Stack:
 *   IndexedDBDataset (hexastore) → Comunica QueryEngine → CRUDFunctions
 *       → initSPARQLStore → AbstractDatastore → CrudProviderContext
 *
 * The component follows the same lifecycle pattern as LocalOxigraphStoreProvider:
 *   1. Open the IndexedDB database asynchronously on mount.
 *   2. Build a QueryEngine and CRUDFunctions once the DB is ready.
 *   3. Call initSPARQLStore with those functions and the schema from AdbContext.
 *   4. Provide the resulting AbstractDatastore via CrudProviderContext.
 *
 * Differences from LocalOxigraphStoreProvider:
 *   - No WebWorker: IndexedDB is already async by nature.
 *   - No bulk-load / persistence management (the IDB store IS the persistence).
 *   - sparqlFlavour is "default" — Comunica uses standard SPARQL 1.1.
 */

import type { FunctionComponent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { IndexedDBDataset } from "@graviola/indexeddb-dataset";
import type { IndexedDBDatasetOptions } from "@graviola/indexeddb-dataset";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import type { SparqlEndpoint } from "@graviola/edb-core-types";
import N3 from "n3";
import { createComunicaCRUDFunctions } from "./comunica-sparql-adapter";

export type IndexedDBStoreProviderProps = {
  children: ReactNode;
  /** IndexedDB database name (default: "graviola-rdf") */
  dbName?: string;
  /** Maximum number of results returned by list/find operations */
  defaultLimit: number;
  /** SPARQL endpoint configuration (used for defaultUpdateGraph, etc.) */
  endpoint?: Partial<SparqlEndpoint>;
  /** Element shown while the database is being opened */
  loader?: ReactNode;
  /** Additional options forwarded to IndexedDBDataset.open() */
  datasetOptions?: Omit<IndexedDBDatasetOptions, "dbName">;
  /**
   * Turtle string to seed the store when it is empty on first open.
   * Loaded once — on subsequent page loads the persisted data is used instead.
   */
  initialData?: string;
};

/** Parse a Turtle string into an array of RDFJS quads. */
function parseTurtle(turtle: string): Promise<N3.Quad[]> {
  return new Promise((resolve, reject) => {
    const quads: N3.Quad[] = [];
    new N3.Parser().parse(turtle, (err, quad) => {
      if (err) return reject(err);
      if (quad) quads.push(quad);
      else resolve(quads);
    });
  });
}

// Singleton engine — QueryEngine is stateless and safe to share across providers
let sharedEngine: QueryEngine | null = null;
function getEngine(): QueryEngine {
  if (!sharedEngine) {
    sharedEngine = new QueryEngine();
  }
  return sharedEngine;
}

export const IndexedDBStoreProvider: FunctionComponent<
  IndexedDBStoreProviderProps
> = ({
  children,
  dbName,
  defaultLimit,
  endpoint,
  loader,
  datasetOptions,
  initialData,
}) => {
  const [dataset, setDataset] = useState<IndexedDBDataset | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Open the IndexedDB database once on mount (or when dbName changes).
  // If the store is empty and initialData is provided, seed it before signalling ready.
  useEffect(() => {
    let cancelled = false;
    let openedDataset: IndexedDBDataset | null = null;

    const tag = `[IDB:provider db="${dbName ?? "graviola-rdf"}"]`;
    (async () => {
      try {
        console.debug(`${tag} Opening database...`);
        const ds = await IndexedDBDataset.open({ dbName, ...datasetOptions });
        openedDataset = ds;
        if (cancelled) {
          ds.close();
          return;
        }

        const sizeOnOpen = await ds.getSize();
        console.debug(`${tag} Opened. Size on open: ${sizeOnOpen} quads`);

        // Seed initial data when the store is empty
        if (initialData) {
          if (sizeOnOpen === 0) {
            try {
              console.debug(
                `${tag} Store is empty — parsing and seeding initial data...`,
              );
              const quads = await parseTurtle(initialData);
              console.debug(
                `${tag} Parsed ${quads.length} quads — importing...`,
              );
              await ds.import(quads);
              const sizeAfterSeed = await ds.getSize();
              console.debug(
                `${tag} Seeding done. Store size now: ${sizeAfterSeed} quads`,
              );
            } catch (err) {
              console.error(`${tag} Failed to seed initial data:`, err);
            }
          } else {
            console.debug(
              `${tag} Store already has ${sizeOnOpen} quads — skipping seed`,
            );
          }
        }

        if (!cancelled) {
          console.debug(`${tag} Provider ready`);
          setDataset(ds);
          setDataLoaded(true);
        } else {
          ds.close();
        }
      } catch (err) {
        console.error(`${tag} Failed to open database:`, err);
      }
    })();

    return () => {
      cancelled = true;
      if (openedDataset) {
        openedDataset
          .flush()
          .then(() => openedDataset!.close())
          .catch(console.error);
      }
    };
  }, [dbName]);

  const {
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    jsonLDConfig: { defaultPrefix, jsonldContext },
  } = useAdbContext();

  const crudOptions = useMemo(() => {
    if (!dataset) return null;
    return createComunicaCRUDFunctions(getEngine(), dataset);
  }, [dataset]);

  const dataStore = useMemo(() => {
    if (!crudOptions) return null;
    return initSPARQLStore({
      defaultPrefix,
      jsonldContext,
      typeNameToTypeIRI,
      queryBuildOptions: {
        ...queryBuildOptions,
        // Comunica accepts standard SPARQL 1.1 — not Oxigraph-specific syntax
        sparqlFlavour: "default",
      },
      walkerOptions: {
        maxRecursion: 3,
        maxRecursionEachRef: 3,
        skipAtLevel: 10,
      },
      sparqlQueryFunctions: crudOptions,
      schema,
      defaultLimit,
      defaultUpdateGraph: endpoint?.defaultUpdateGraph,
    });
  }, [
    crudOptions,
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    defaultPrefix,
    jsonldContext,
    defaultLimit,
    endpoint?.defaultUpdateGraph,
  ]);

  const isReady = Boolean(dataset && dataStore && dataLoaded);

  return (
    <CrudProviderContext.Provider
      value={{
        crudOptions,
        dataStore,
        isReady,
      }}
    >
      {!loader || isReady ? children : loader}
    </CrudProviderContext.Provider>
  );
};
