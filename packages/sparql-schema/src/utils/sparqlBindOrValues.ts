import type { Variable } from "@rdfjs/types";
import type {
  SPARQLFlavour,
  Prefixes,
  ResolvedSparqlFeatureFlags,
} from "@graviola/edb-core-types";
import { resolveSparqlFeatures } from "@graviola/edb-core-utils";
import { sparql, type SparqlTemplateResult } from "@tpluscode/sparql-builder";
import { convertIRIToNode } from "./iriConverter";

type BindOrValuesOptions = {
  useBind?: boolean;
  flavour?: SPARQLFlavour;
  features?: ResolvedSparqlFeatureFlags;
  prefixMap?: Prefixes;
};

/**
 * Creates a SPARQL pattern that binds entity IRI(s) to a variable using either BIND or VALUES clause.
 *
 * Uses BIND for single entities when `bindSingleSubject` is enabled (Oxigraph profile).
 * Uses VALUES for multiple entities or other SPARQL engines (avoids SP031 error in Virtuoso).
 */
export const createBindOrValuesPattern = (
  entityIRI: string | string[],
  variable: Variable,
  options?: BindOrValuesOptions,
): SparqlTemplateResult => {
  const entityIRIList = Array.isArray(entityIRI) ? entityIRI : [entityIRI];

  if (entityIRIList.length === 0) {
    throw new Error("entityIRIList is empty, would result in invalid SPARQL");
  }

  const prefixMap = options?.prefixMap || {};
  const entityNodes = entityIRIList.map((iri) =>
    convertIRIToNode(iri, prefixMap),
  );

  const features = options?.features ?? resolveSparqlFeatures(options?.flavour);
  const shouldUseBind = options?.useBind ?? features.bindSingleSubject;

  if (entityNodes.length === 1 && shouldUseBind) {
    return sparql`BIND(${entityNodes[0]} AS ${variable}) .`;
  } else {
    return sparql`VALUES ${variable} { ${entityNodes} }`;
  }
};
