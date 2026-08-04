import { SparqlEndpoint, WorkerProvider } from "@graviola/edb-core-types";

import { allegroCrudOptions } from "./remoteAllegro";
import { oxigraphCrudOptions } from "./remoteOxigraph";
import { qleverCrudOptions } from "./remoteQlever";

const workerProvider: WorkerProvider = {
  oxigraph: oxigraphCrudOptions,
  allegro: allegroCrudOptions,
  qlever: qleverCrudOptions,
  virtuoso: oxigraphCrudOptions,
  blazegraph: oxigraphCrudOptions,
  fuseki: oxigraphCrudOptions,
  worker: null,
  rest: null,
};

export const getProviderOrDefault = (endpoint: SparqlEndpoint) =>
  endpoint.provider && typeof workerProvider[endpoint.provider] === "function"
    ? workerProvider[endpoint.provider]
    : oxigraphCrudOptions;
