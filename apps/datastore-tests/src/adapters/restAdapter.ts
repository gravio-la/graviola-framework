/**
 * REST adapter — exercises the v1 wire through createStoreRestHandler + RESTClientStore.
 *
 * Default mode: in-process (handler called via fetchImpl, no port).
 * Opt-in real HTTP: REST_HTTP=1 starts a Hono server on an ephemeral port.
 *
 * Backend store is in-process Oxigraph (same as the always-on SPARQL adapter).
 */
import type { CRUDFunctions } from "@graviola/edb-core-types";
import {
  createRESTClientStore,
  createRestTransport,
  fetchGraviolaStoreHandshake,
  createRESTClientStoreClient,
} from "@graviola/rest-store-client";
import { createStoreRestHandler } from "@graviola/rest-store-server";
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
import type { DatastoreAdapter, DatastoreContractStore } from "../types";

function makeSyncStoreCRUDFunctions(store: Store): CRUDFunctions {
  return {
    askFetch: async (query: string): Promise<boolean> => {
      return Boolean(store.query(query));
    },
    constructFetch: async (query: string) => {
      const quads = (store.query(query) as Quad[]) ?? [];
      return datasetFactory.dataset(quads);
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

const TYPE_NAMES = ["Item", "Category", "Tag"];

function useRealHttp(): boolean {
  const v = process.env.REST_HTTP;
  if (!v) return false;
  return !["0", "false", "no"].includes(v.trim().toLowerCase());
}

export function createRestAdapter(): DatastoreAdapter {
  let oxigraph: Store;
  let stopServer: (() => Promise<void>) | undefined;

  return {
    name: useRealHttp()
      ? "REST/Oxigraph (Hono HTTP)"
      : "REST/Oxigraph (in-process)",

    setup: async () => {
      oxigraph = new Store();
      const crudFunctions = makeSyncStoreCRUDFunctions(oxigraph);

      const pair = initSPARQLDatastorePair({
        schema: rawTestSchema as any,
        defaultPrefix: BASE_IRI,
        jsonldContext: { "@vocab": BASE_IRI },
        typeNameToTypeIRI,
        queryBuildOptions: {
          ...queryBuildOptions,
          sparqlFlavour: "oxigraph",
        },
        sparqlQueryFunctions: crudFunctions,
        defaultLimit: 100,
      });

      const handler = createStoreRestHandler({
        store: pair.store as never,
        typeNames: TYPE_NAMES,
        basePath: "/api/graviola",
      });

      const identifies = {
        typeNameToTypeIRI,
        typeIRItoTypeName,
      };

      if (useRealHttp()) {
        const { createGraviolaHonoApp } =
          await import("@graviola/rest-server-hono");
        const app = createGraviolaHonoApp({
          store: pair.store as never,
          typeNames: TYPE_NAMES,
          basePath: "/api/graviola",
          enableLogger: false,
          cors: false,
        });

        const bunGlobal = (
          globalThis as typeof globalThis & {
            Bun?: {
              serve: (o: {
                port: number;
                hostname: string;
                fetch: (req: Request) => Response | Promise<Response>;
              }) => { port: number; stop: () => void };
            };
          }
        ).Bun;

        if (!bunGlobal?.serve) {
          throw new Error("REST_HTTP=1 requires Bun.serve");
        }

        const server = bunGlobal.serve({
          port: 0,
          hostname: "127.0.0.1",
          fetch: (req) => app.fetch(req),
        });
        stopServer = async () => {
          server.stop(true);
        };

        const baseUrl = `http://127.0.0.1:${server.port}`;
        const client = await createRESTClientStore({
          baseUrl,
          auth: { mode: "none" },
          identifies,
          iriHandling: "fullIRI",
          handshakePath: "/.well-known/graviola-store",
        });

        return { store: client as unknown as DatastoreContractStore };
      }

      // In-process: handler as fetchImpl
      const baseUrl = "http://in-process.rest.test";
      const fetchImpl = (async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        const req =
          input instanceof Request ? input : new Request(input, init ?? {});
        const res = await handler(req);
        return res ?? new Response("Not Found", { status: 404 });
      }) as typeof fetch;

      const transport = createRestTransport({
        baseUrl,
        auth: { mode: "none" },
        fetchImpl,
        retry: 0,
      });
      const handshake = await fetchGraviolaStoreHandshake(
        transport,
        "/.well-known/graviola-store",
      );
      const client = createRESTClientStoreClient({
        transport,
        handshake,
        identifies,
        iriHandling: "fullIRI",
      });

      return { store: client as unknown as DatastoreContractStore };
    },

    clearAll: async () => {
      oxigraph.update("CLEAR ALL");
    },

    teardown: async () => {
      await stopServer?.();
    },
  };
}
