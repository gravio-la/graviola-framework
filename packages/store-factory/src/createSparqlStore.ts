import {
  defaultTypeIRItoTypeName,
  defaultTypeNameToTypeIRI,
  resolveDefaultPrefix,
  typeNamesFromSchema,
} from "./helpers.js";
import type {
  CreateStoreFromSpecOptions,
  CreateStoreResult,
  SparqlBackendSpec,
} from "./types.js";

export async function createSparqlStore(
  opts: CreateStoreFromSpecOptions & { backend: SparqlBackendSpec },
): Promise<CreateStoreResult> {
  const { initSPARQLStore } = await import("@graviola/sparql-db-impl");
  const { createHttpSparqlCrudFunctions } =
    await import("@graviola/remote-query-implementations");
  const { sparqlEndpointUrls } = await import("@graviola/sparql-tools");

  const defaultPrefix = resolveDefaultPrefix(opts.schema, opts.defaultPrefix);
  const typeNameToTypeIRI =
    opts.typeNameToTypeIRI ?? defaultTypeNameToTypeIRI(defaultPrefix);
  const typeIRItoTypeName =
    opts.typeIRItoTypeName ?? defaultTypeIRItoTypeName(defaultPrefix);

  const urls = sparqlEndpointUrls(opts.backend.endpoint);
  const flavour = opts.backend.flavour ?? "oxigraph";
  const constructResultFormat =
    opts.backend.constructResultFormat ??
    (flavour === "oxigraph" ? "ntriples" : "turtle");

  const crud = createHttpSparqlCrudFunctions({
    queryUrl: urls.query,
    updateUrl: urls.update,
    constructResultFormat,
  });

  const primaryFields = opts.primaryFields ?? {};

  const store = initSPARQLStore({
    schema: opts.schema,
    defaultPrefix,
    jsonldContext: opts.jsonldContext ?? { "@vocab": defaultPrefix },
    typeNameToTypeIRI,
    queryBuildOptions: {
      primaryFields,
      primaryFieldExtracts: {},
      typeIRItoTypeName,
      propertyToIRI: typeNameToTypeIRI,
      sparqlFlavour: flavour,
      ...(opts.queryBuildOptions ?? {}),
    },
    sparqlQueryFunctions: crud,
    defaultLimit: opts.defaultLimit ?? 100,
  });

  return {
    store: store as unknown as CreateStoreResult["store"],
    typeNames: typeNamesFromSchema(opts.schema),
  };
}
