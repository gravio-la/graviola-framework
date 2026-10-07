import { SPARQLCRUDOptions } from "@graviola/edb-core-types";
import { DELETE } from "@tpluscode/sparql-builder";
import { JSONSchema7 } from "json-schema";

import {
  makeSPARQLWherePart,
  buildQueryWithPrefixAndGraph,
} from "@/crud/makeSPARQLWherePart";
import { jsonSchema2construct } from "@/schema2sparql/jsonSchema2construct";

export const makeSPARQLDeleteQuery = (
  entityIRI: string,
  typeIRI: string | undefined,
  schema: JSONSchema7,
  options: SPARQLCRUDOptions,
) => {
  const { defaultPrefix, queryBuildOptions } = options;
  const wherePart = typeIRI
    ? makeSPARQLWherePart(entityIRI, typeIRI, "?subject", {
        flavour: options.queryBuildOptions?.sparqlFlavour,
      })
    : "";
  // Same boundary as the DELETE of a save: the entity's own triples and the
  // anonymous (blank-node) objects it owns, never a named entity it links to.
  // The blank-node guard in the patterns enforces that on the data, so the
  // nested objects must be followed here — with depth 0 they stayed behind as
  // orphans after every remove.
  const { construct, whereRequired, whereOptionals } = jsonSchema2construct(
    entityIRI,
    schema,
    ["@id"],
    ["@id", "@type"],
    options.maxRecursion,
  );
  const deleteQuery = DELETE` ${construct} `
    .WHERE`${wherePart} ${whereRequired}\n${whereOptionals}`;

  return buildQueryWithPrefixAndGraph(
    defaultPrefix,
    options.defaultUpdateGraph,
    deleteQuery,
    queryBuildOptions,
    options.queryBuildOptions?.sparqlFlavour,
  );
};
