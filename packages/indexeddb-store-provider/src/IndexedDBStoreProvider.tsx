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
 *   - Optional dev reseed via {@link IndexedDBReseedStrategy} `"always-in-dev"` + fingerprint.
 */

import type { FunctionComponent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IndexedDBDataset } from "@graviola/indexeddb-dataset";
import type { IndexedDBDatasetOptions } from "@graviola/indexeddb-dataset";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import type { SparqlEndpoint } from "@graviola/edb-core-types";
import { DEFAULT_DB_NAME } from "@graviola/indexeddb-dataset";
import { createComunicaCRUDFunctions } from "./comunica-sparql-adapter";
import { parseTurtle } from "./parseTurtle";
import { getSharedComunicaEngine } from "./sharedComunicaEngine";
import { NativeRdfDatasetContext } from "./nativeRdfDatasetContext";

/** How {@link IndexedDBStoreProvider} applies {@link IndexedDBStoreProviderProps.initialData}. */
export type IndexedDBReseedStrategy =
  /** Seed only when the dataset has zero quads (default). */
  | "seed-if-empty"
  /**
   * When {@link IndexedDBStoreProviderProps.reseedFingerprint} differs from the last
   * stored value for this {@link IndexedDBStoreProviderProps.dbName}, destroy the DB,
   * reopen, and import {@link IndexedDBStoreProviderProps.initialData}.
   * Intended for dev workflows (e.g. fixture hot-reload); callers should pass this only in dev.
   */
  | "always-in-dev";

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
  /**
   * If set, only the first N quads from {@link initialData} are passed to
   * `IndexedDBDataset.import` (parser still runs through the whole Turtle).
   * Use this to stress-test with a fraction of a large fixture without splitting files.
   */
  initialDataMaxQuads?: number;
  /**
   * When true, `upsertDocument` runs inverse-property sync queries (`x-inverseOf`), matching
   * {@link LocalOxigraphStoreProvider}.
   */
  enableInversePropertiesFeature?: boolean;
  /** Defaults to `"seed-if-empty"`. */
  reseedStrategy?: IndexedDBReseedStrategy;
  /**
   * Stable fingerprint for {@link reseedStrategy} `"always-in-dev"` (e.g. hash of fixture Turtle).
   * If omitted while using `"always-in-dev"`, behavior falls back to seed-if-empty only.
   */
  reseedFingerprint?: string;
  /**
   * When true, logs provider lifecycle with `console.debug`. Dataset tracing uses
   * {@link IndexedDBDatasetOptions.debugLogging} (merged from {@link datasetOptions}).
   * Defaults to false.
   */
  debugLogging?: boolean;
};

function effectiveDbName(dbName?: string): string {
  return dbName ?? DEFAULT_DB_NAME;
}

function reseedFingerprintStorageKey(dbName: string): string {
  return `graviola-indexeddb-reseed-fp:${dbName}`;
}

function readStoredReseedFingerprint(dbName: string): string | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  try {
    return globalThis.localStorage.getItem(reseedFingerprintStorageKey(dbName));
  } catch {
    return null;
  }
}

function writeStoredReseedFingerprint(
  dbName: string,
  fingerprint: string,
): void {
  if (typeof globalThis.localStorage === "undefined") return;
  try {
    globalThis.localStorage.setItem(
      reseedFingerprintStorageKey(dbName),
      fingerprint,
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function logDebug(enabled: boolean, ...args: unknown[]): void {
  if (enabled) {
    console.debug(...args);
  }
}

async function importInitialTurtleData(
  ds: IndexedDBDataset,
  turtle: string,
  args: {
    maxQuads?: number;
    tag: string;
    debugLogging: boolean;
  },
): Promise<void> {
  const t0 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  const { quads, quadsInDocument, capped } = await parseTurtle(turtle, {
    maxQuads: args.maxQuads,
  });
  const t1 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  logDebug(
    args.debugLogging,
    `${args.tag} [import perf] parse: ${(t1 - t0).toFixed(1)}ms — kept ${quads.length} quads for import` +
      (capped
        ? ` (capped; parser finished whole file, ${quadsInDocument} quads total)`
        : ` (${quadsInDocument} quads in file)`),
  );
  const t2 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  await ds.import(quads);
  const t3 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  const sizeAfter = await ds.getSize();
  const t4 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  logDebug(
    args.debugLogging,
    `${args.tag} [import perf] persist: import+flush ${(t3 - t2).toFixed(1)}ms, getSize ${(t4 - t3).toFixed(1)}ms → store has ${sizeAfter} quads`,
  );
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
  initialDataMaxQuads,
  enableInversePropertiesFeature,
  reseedStrategy = "seed-if-empty",
  reseedFingerprint,
  debugLogging = false,
}) => {
  const [dataset, setDataset] = useState<IndexedDBDataset | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  /**
   * Always read the latest `datasetOptions` inside effects without listing it in deps.
   * Inline `{}` from callers would change identity every render and reopen IndexedDB in a loop.
   */
  const datasetOptionsRef = useRef(datasetOptions);
  datasetOptionsRef.current = datasetOptions;

  /** Snapshot for IndexedDBDataset.open — merges provider debug flag with caller options. */
  const snapshotDatasetOpenArgs = (): IndexedDBDatasetOptions => {
    const opts = datasetOptionsRef.current;
    const debugMerged = opts?.debugLogging ?? debugLogging ?? false;
    return {
      dbName,
      ...opts,
      debugLogging: debugMerged,
    };
  };

  // Open the IndexedDB database once on mount (or when dbName / seed inputs change).
  useEffect(() => {
    let cancelled = false;
    let openedDataset: IndexedDBDataset | null = null;

    const resolvedDbName = effectiveDbName(dbName);
    const tag = `[IDB:provider db="${resolvedDbName}"]`;

    (async () => {
      try {
        logDebug(debugLogging, `${tag} Opening database...`);
        let ds = await IndexedDBDataset.open(snapshotDatasetOpenArgs());
        openedDataset = ds;
        if (cancelled) {
          ds.close();
          return;
        }

        let sizeOnOpen = await ds.getSize();
        logDebug(
          debugLogging,
          `${tag} Opened. Size on open: ${sizeOnOpen} quads`,
        );

        const trimmedInitial = initialData?.trim() ?? "";
        const shouldFingerprintReseed =
          reseedStrategy === "always-in-dev" &&
          trimmedInitial.length > 0 &&
          reseedFingerprint !== undefined &&
          reseedFingerprint.length > 0;

        if (shouldFingerprintReseed) {
          const storedFp = readStoredReseedFingerprint(resolvedDbName);
          const fpChanged = storedFp !== reseedFingerprint;

          if (fpChanged) {
            logDebug(
              debugLogging,
              `${tag} Reseed: fingerprint changed (${storedFp ?? "none"} → ${reseedFingerprint}) — destroying and re-importing...`,
            );
            await ds.flush();
            await ds.destroy();
            openedDataset = null;

            ds = await IndexedDBDataset.open(snapshotDatasetOpenArgs());
            openedDataset = ds;
            if (cancelled) {
              ds.close();
              return;
            }

            try {
              await importInitialTurtleData(ds, trimmedInitial, {
                maxQuads: initialDataMaxQuads,
                tag,
                debugLogging,
              });
              writeStoredReseedFingerprint(resolvedDbName, reseedFingerprint);
              logDebug(
                debugLogging,
                `${tag} Reseed done (fingerprint stored).`,
              );
            } catch (err) {
              console.error(`${tag} Failed to import after reseed:`, err);
            }
          } else {
            logDebug(
              debugLogging,
              `${tag} Reseed skipped — fingerprint unchanged (${reseedFingerprint})`,
            );
          }
        } else if (trimmedInitial.length > 0) {
          // seed-if-empty (default), or always-in-dev without a fingerprint
          if (sizeOnOpen === 0) {
            try {
              logDebug(
                debugLogging,
                `${tag} Store is empty — parsing and seeding initial data...`,
              );
              await importInitialTurtleData(ds, trimmedInitial, {
                maxQuads: initialDataMaxQuads,
                tag,
                debugLogging,
              });
              logDebug(debugLogging, `${tag} Seeding done.`);
            } catch (err) {
              console.error(`${tag} Failed to seed initial data:`, err);
            }
          } else {
            logDebug(
              debugLogging,
              `${tag} Store already has ${sizeOnOpen} quads — skipping seed`,
            );
          }
        }

        if (!cancelled) {
          logDebug(debugLogging, `${tag} Provider ready`);
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
  }, [
    dbName,
    reseedStrategy,
    reseedFingerprint,
    initialData,
    initialDataMaxQuads,
    debugLogging,
  ]);

  const {
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    jsonLDConfig: { defaultPrefix, jsonldContext },
  } = useAdbContext();

  const crudOptions = useMemo(() => {
    if (!dataset) return null;
    return createComunicaCRUDFunctions(getSharedComunicaEngine(), dataset);
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
      enableInversePropertiesFeature,
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
    enableInversePropertiesFeature,
  ]);

  const isReady = Boolean(dataset && dataStore && dataLoaded);

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
      <NativeRdfDatasetContext.Provider value={dataset}>
        {!loader || isReady ? children : loader}
      </NativeRdfDatasetContext.Provider>
    </CrudProviderContext.Provider>
  );
};
