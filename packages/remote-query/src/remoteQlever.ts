import { createSparqlEndpointCrud } from "./endpointCrud";

export const qleverCrudOptions = createSparqlEndpointCrud({
  accept: "application/qlever-results+json",
  constructToNTriples: async (res) => {
    const jsonRes = await res.json();
    return (
      jsonRes?.res
        ?.map(
          ([subject, predicate, object]: [string, string, string]) =>
            `${subject} ${predicate} ${object} .`,
        )
        ?.join("\n") || ""
    );
  },
  updateFetchImpl: async (_query: string) => {
    throw new Error("qleverCrudOptions:updateFetch not implemented");
  },
});
