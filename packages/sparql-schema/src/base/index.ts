import isNil from "lodash-es/isNil";
import df from "@rdfjs/data-model";

export const GRAVOILA_ONTOLOGY_IRI = "http://graviola.gra.one/ontology#";
export const QUERY_RESULT_SUBJECT_IRI = `${GRAVOILA_ONTOLOGY_IRI}QueryResultSubject`;
export const QUERY_RESULT_SUBJECT_IRI_NODE = df.namedNode(
  QUERY_RESULT_SUBJECT_IRI,
);

export type OptionalStringOrStringArray = string | string[] | undefined | null;

export const isNilOrEmpty = (
  value: OptionalStringOrStringArray,
): value is undefined | null => {
  return isNil(value) || (Array.isArray(value) && value.length === 0);
};
