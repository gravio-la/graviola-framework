/**
 * InMemoryStoreProvider — RDF backed by {@link import("n3").Store} in RAM + Comunica SPARQL.
 *
 * Optional Turtle {@link InMemoryStoreProviderProps.initialData} is parsed once per effect run.
 * SPARQL UPDATE mutates the same in-memory DatasetCore. No IndexedDB persistence.
 *
 * Single-document reads (`loadOne`, list/stream hydration) traverse the in-memory RDF graph directly
 * instead of issuing CONSTRUCT queries.
 */

import type { FunctionComponent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import N3 from "n3";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import type { SparqlEndpoint } from "@graviola/edb-core-types";
import { createComunicaCRUDFunctions } from "./comunica-sparql-adapter";
import { parseTurtle } from "./parseTurtle";
import { getSharedComunicaEngine } from "./sharedComunicaEngine";
import { NativeRdfDatasetContext } from "./nativeRdfDatasetContext";
import { wrapSparqlStoreWithInMemoryTraverseLoad } from "./wrapTraverseInMemoryStore";

function logDebug(enabled: boolean, ...args: unknown[]): void {
  if (enabled) {
    console.debug(...args);
  }
}

export type InMemoryStoreProviderProps = {
  children: ReactNode;
  defaultLimit: number;
  endpoint?: Partial<SparqlEndpoint>;
  loader?: ReactNode;
  initialData?: string;
  /** Same semantics as IndexedDB provider — parser still scans full Turtle */
  initialDataMaxQuads?: number;
  enableInversePropertiesFeature?: boolean;
  debugLogging?: boolean;
};

export const InMemoryStoreProvider: FunctionComponent<
  InMemoryStoreProviderProps
> = ({
  children,
  defaultLimit,
  endpoint,
  loader,
  initialData,
  initialDataMaxQuads,
  enableInversePropertiesFeature,
  debugLogging = false,
}) => {
  const [store, setStore] = useState<N3.Store | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tag = "[InMemory:provider]";
    const trimmed = initialData?.trim() ?? "";

    (async () => {
      try {
        const snapshot = new N3.Store();
        if (trimmed.length > 0) {
          logDebug(debugLogging, `${tag} Parsing initial Turtle...`);
          const t0 =
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();
          const { quads, quadsInDocument, capped } = await parseTurtle(
            trimmed,
            {
              maxQuads: initialDataMaxQuads,
            },
          );
          const t1 =
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();
          logDebug(
            debugLogging,
            `${tag} [import perf] parse: ${(t1 - t0).toFixed(1)}ms — kept ${quads.length} quads` +
              (capped
                ? ` (capped; ${quadsInDocument} total in file)`
                : ` (${quadsInDocument} in file)`),
          );
          const t2 =
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();
          for (const q of quads) {
            snapshot.addQuad(q);
          }
          const t3 =
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();
          logDebug(
            debugLogging,
            `${tag} addQuads ${(t3 - t2).toFixed(1)}ms — store.size=${snapshot.size}`,
          );
        } else {
          logDebug(debugLogging, `${tag} Empty Turtle — starting with 0 quads`);
        }

        if (!cancelled) {
          logDebug(debugLogging, `${tag} Provider ready`);
          setStore(snapshot);
          setDataLoaded(true);
        }
      } catch (err) {
        console.error(`${tag} Failed to build store:`, err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialData, initialDataMaxQuads, debugLogging]);

  const {
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    jsonLDConfig: { defaultPrefix, jsonldContext },
  } = useAdbContext();

  const crudOptions = useMemo(() => {
    if (!store) return null;
    return createComunicaCRUDFunctions(getSharedComunicaEngine(), store, {
      debugLogging,
    });
  }, [store, debugLogging]);

  const dataStore = useMemo(() => {
    if (!crudOptions || !store) return null;
    const qb = {
      ...queryBuildOptions,
      sparqlFlavour: "default" as const,
    };
    const walkers = {
      maxRecursion: 3,
      maxRecursionEachRef: 3,
      skipAtLevel: 10,
    };

    const base = initSPARQLStore({
      defaultPrefix,
      jsonldContext,
      typeNameToTypeIRI,
      queryBuildOptions: qb,
      walkerOptions: walkers,
      sparqlQueryFunctions: crudOptions,
      schema,
      defaultLimit,
      defaultUpdateGraph: endpoint?.defaultUpdateGraph,
      enableInversePropertiesFeature,
    });

    return wrapSparqlStoreWithInMemoryTraverseLoad(base, {
      traversableDataset: store,
      defaultPrefix,
      rootSchema: schema,
      walkerOptions: walkers,
      queryBuildOptions: qb,
      defaultLimit,
      selectFetch: crudOptions.selectFetch,
    });
  }, [
    crudOptions,
    store,
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    defaultPrefix,
    jsonldContext,
    defaultLimit,
    endpoint?.defaultUpdateGraph,
    enableInversePropertiesFeature,
  ]);

  const isReady = Boolean(store && dataStore && dataLoaded);

  const crudProviderValue = useMemo(
    () => ({
      crudOptions,
      dataStore,
      isReady,
    }),
    [crudOptions, dataStore, isReady],
  );

  return (
    <CrudProviderContext.Provider value={crudProviderValue}>
      <NativeRdfDatasetContext.Provider value={store}>
        {!loader || isReady ? children : loader}
      </NativeRdfDatasetContext.Provider>
    </CrudProviderContext.Provider>
  );
};
