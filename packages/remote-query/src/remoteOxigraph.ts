import type { CRUDFunctions, SparqlEndpoint } from "@graviola/edb-core-types";

import { createHttpSparqlCrudFunctions } from "./httpSparqlCrud";

export const oxigraphCrudOptions: (
  endpoint: SparqlEndpoint,
) => CRUDFunctions = ({ endpoint: url, auth }: SparqlEndpoint) =>
  createHttpSparqlCrudFunctions({
    queryUrl: url,
    updateUrl: url.replace(/\/query$/, "/update"),
    auth,
    constructResultFormat: "ntriples",
  });
