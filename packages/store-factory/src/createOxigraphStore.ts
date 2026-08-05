import type { CRUDFunctions } from "@graviola/edb-core-types";
import type { Quad } from "@rdfjs/types";

import {
  defaultTypeIRItoTypeName,
  defaultTypeNameToTypeIRI,
  resolveDefaultPrefix,
  typeNamesFromSchema,
} from "./helpers.js";
import type {
  CreateStoreFromSpecOptions,
  CreateStoreResult,
  OxigraphBackendSpec,
} from "./types.js";

function makeSyncStoreCRUDFunctions(store: {
  query: (q: string, opts?: { results_format?: string }) => unknown;
  update: (q: string) => void;
}): CRUDFunctions {
  return {
    askFetch: async (query: string): Promise<boolean> => {
      return Boolean(store.query(query));
    },
    constructFetch: async (query: string) => {
      const { default: datasetFactory } = await import("@rdfjs/dataset");
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

export async function createOxigraphStore(
  opts: CreateStoreFromSpecOptions & { backend: OxigraphBackendSpec },
): Promise<CreateStoreResult> {
  const { Store } = await import("oxigraph");
  const { initSPARQLStore } = await import("@graviola/sparql-db-impl");

  const defaultPrefix = resolveDefaultPrefix(opts.schema, opts.defaultPrefix);
  const typeNameToTypeIRI =
    opts.typeNameToTypeIRI ?? defaultTypeNameToTypeIRI(defaultPrefix);
  const typeIRItoTypeName =
    opts.typeIRItoTypeName ?? defaultTypeIRItoTypeName(defaultPrefix);

  const ox = new Store();
  if (opts.backend.initialData) {
    ox.load(opts.backend.initialData, {
      format: "text/turtle",
      base_iri: opts.backend.baseIri ?? defaultPrefix,
    });
  }

  const crud = makeSyncStoreCRUDFunctions(ox);
  const primaryFields = opts.primaryFields ?? {};

  const store = initSPARQLStore({
    schema: opts.schema,
    defaultPrefix,
    jsonldContext: opts.jsonldContext ?? { "@vocab": defaultPrefix },
    typeNameToTypeIRI,
    queryBuildOptions: {
      primaryFields,
      typeIRItoTypeName,
      propertyToIRI: typeNameToTypeIRI,
      sparqlFlavour: "oxigraph",
      ...(opts.queryBuildOptions ?? {}),
    },
    sparqlQueryFunctions: crud,
    defaultLimit: opts.defaultLimit ?? 100,
  });

  return {
    store: store as CreateStoreResult["store"],
    typeNames: typeNamesFromSchema(opts.schema),
  };
}
