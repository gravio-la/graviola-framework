import { SPARQLCRUDOptions } from "@graviola/edb-core-types";
import df from "@rdfjs/data-model";
import { SELECT } from "@tpluscode/sparql-builder";

import { iriRef } from "../sparqlTerms";

export const getClasses = async (
  entityIRI: string,
  selectFetch: (query: string) => Promise<any>,
  options: SPARQLCRUDOptions,
): Promise<string[] | null> => {
  const { queryBuildOptions } = options;
  const classes = df.variable("classes");
  const query = SELECT`${classes}`.WHERE`
      ${iriRef(entityIRI)} a ${classes} .
    `.build(queryBuildOptions);
  try {
    const result = await selectFetch(query);
    return result.map(({ classes }) => classes.value);
  } catch (e) {
    console.error(e);
  }
  return null;
};
