import { createSparqlEndpointCrud } from "./endpointCrud";

export const allegroCrudOptions = createSparqlEndpointCrud({
  accept: "application/n-triples,*/*;q=0.9",
  constructToNTriples: async (res) => res.text(),
});
