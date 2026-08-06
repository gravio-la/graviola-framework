/**
 * Local Oxigraph adapter — always-on reference implementation.
 *
 * Uses the `oxigraph` npm package's synchronous `Store` API directly in-process,
 * without any WebWorker or HTTP server. This is the zero-infrastructure adapter.
 *
 * Pattern mirrors packages/local-oxigraph-store-provider/src/localSyncOxigraph.ts
 * but without React dependencies.
 *
 * Known caveat: WASM error messages from Oxigraph can be opaque.
 * If a test fails here but not on the Docker HTTP adapter, the issue is
 * likely in the local WASM layer, not the store logic.
 */
import type { CRUDFunctions } from "@graviola/edb-core-types";
import { initSPARQLDatastorePair } from "@graviola/sparql-db-impl";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import { Store } from "oxigraph";

import {
  rawTestSchema,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  queryBuildOptions,
  BASE_IRI,
} from "../schema/testSchema";
import {
  sparqlMetaStampingConfig,
  sparqlMetaStampingDatabaseNativeConfig,
  sparqlMetaStampingLifecycleOff,
  sparqlMetaTestSchema,
} from "../schema/metaTestConfig";
import {
  sparqlStatementNodeMetaConfig,
  sparqlStatementRdf12MetaConfig,
} from "../schema/statementTestConfig";
import type {
  DatastoreAdapter,
  DatastoreContractStore,
  DatastoreContractStoreWithStatements,
} from "../types";

/** Build CRUDFunctions that delegate to a synchronous Oxigraph Store. */
function makeSyncStoreCRUDFunctions(store: Store): CRUDFunctions {
  return {
    askFetch: async (query: string): Promise<boolean> => {
      return Boolean(store.query(query));
    },

    constructFetch: async (query: string) => {
      const quads = (store.query(query) as Quad[]) ?? [];
      try {
        return datasetFactory.dataset(quads);
      } catch (e: any) {
        throw new Error(
          `constructFetch: failed to build dataset — ${e.message}`,
        );
      }
    },

    updateFetch: async (query: string) => {
      store.update(query);
    },

    selectFetch: ((query: string, options?: { withHeaders?: boolean }) => {
      const raw = store.query(query, {
        results_format: "application/sparql-results+json",
      }) as string;
      const parsed = JSON.parse(raw || "{}");
      return Promise.resolve(
        options?.withHeaders ? parsed : (parsed.results?.bindings ?? []),
      );
    }) as CRUDFunctions["selectFetch"],
  };
}

export function createOxigraphLocalAdapter(): DatastoreAdapter {
  let store: Store;

  return {
    name: "SPARQL/Oxigraph (in-process)",

    setup: async () => {
      store = new Store();
      const crudFunctions = makeSyncStoreCRUDFunctions(store);

      const pair = initSPARQLDatastorePair({
        schema: rawTestSchema as any,
        defaultPrefix: BASE_IRI,
        jsonldContext: { "@vocab": BASE_IRI },
        typeNameToTypeIRI,
        queryBuildOptions: {
          ...queryBuildOptions,
          // Oxigraph ≥ 0.3.11 — nested include pagination via LATERAL
          sparqlFlavour: "oxigraph",
        },
        sparqlQueryFunctions: crudFunctions,
        defaultLimit: 100,
      });

      const metaPair = (config: typeof sparqlMetaStampingConfig) =>
        initSPARQLDatastorePair({
          schema: sparqlMetaTestSchema as any,
          defaultPrefix: BASE_IRI,
          jsonldContext: { "@vocab": BASE_IRI },
          typeNameToTypeIRI,
          queryBuildOptions: {
            ...queryBuildOptions,
            sparqlFlavour: "oxigraph",
          },
          sparqlQueryFunctions: crudFunctions,
          defaultLimit: 100,
          metaStamping: config,
        });

      const { store: metaStampingStore } = metaPair(sparqlMetaStampingConfig);
      const { store: lifecycleOffStore } = metaPair(
        sparqlMetaStampingLifecycleOff,
      );
      const { store: sparqlNativeConfigStore } = metaPair(
        sparqlMetaStampingDatabaseNativeConfig,
      );

      const statementPair = (encoding: "statement-node" | "rdf-12") =>
        initSPARQLDatastorePair({
          schema: sparqlMetaTestSchema as any,
          defaultPrefix: BASE_IRI,
          jsonldContext: { "@vocab": BASE_IRI },
          typeNameToTypeIRI,
          queryBuildOptions: {
            ...queryBuildOptions,
            sparqlFlavour: "oxigraph",
          },
          sparqlQueryFunctions: crudFunctions,
          defaultLimit: 100,
          statementMeta:
            encoding === "rdf-12"
              ? sparqlStatementRdf12MetaConfig
              : sparqlStatementNodeMetaConfig,
        });

      const { store: statementStore } = statementPair("statement-node");
      const { store: statementStoreRdf12 } = statementPair("rdf-12");
      const { store: statementMetaStampingStore } = initSPARQLDatastorePair({
        schema: sparqlMetaTestSchema as any,
        defaultPrefix: BASE_IRI,
        jsonldContext: { "@vocab": BASE_IRI },
        typeNameToTypeIRI,
        queryBuildOptions: {
          ...queryBuildOptions,
          sparqlFlavour: "oxigraph",
        },
        sparqlQueryFunctions: crudFunctions,
        defaultLimit: 100,
        metaStamping: sparqlMetaStampingConfig,
        statementMeta: sparqlStatementNodeMetaConfig,
      });

      return {
        store: pair.store as DatastoreContractStore,
        metaStampingStore: metaStampingStore as DatastoreContractStore,
        metaStampingStores: {
          lifecycleOff: lifecycleOffStore as DatastoreContractStore,
          sparqlNativeConfig: sparqlNativeConfigStore as DatastoreContractStore,
        },
        statementStore: statementStore as DatastoreContractStoreWithStatements,
        statementStoreRdf12:
          statementStoreRdf12 as DatastoreContractStoreWithStatements,
        statementMetaStampingStore:
          statementMetaStampingStore as DatastoreContractStoreWithStatements,
      };
    },

    clearAll: async () => {
      store.update("CLEAR ALL");
    },

    teardown: async () => {
      // Oxigraph Store is GC'd; nothing to close for the sync variant
    },
  };
}
