export { allegroCrudOptions } from "./remoteAllegro";
export { oxigraphCrudOptions } from "./remoteOxigraph";
export { qleverCrudOptions } from "./remoteQlever";
export {
  createSparqlEndpointCrud,
  type ConstructToNTriples,
  type SparqlEndpointCrudPreset,
} from "./endpointCrud";
export {
  getSPARQLFlavour,
  getSparqlDialect,
  type SparqlDialect,
} from "./getSPARQLFlavour";
export {
  createHttpSparqlCrudFunctions,
  type HttpSparqlCrudOptions,
} from "./httpSparqlCrud";
