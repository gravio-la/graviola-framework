import isNil from "lodash-es/isNil";
import df from "@rdfjs/data-model";
import {
  GRAVIOLA_ONTOLOGY_IRI,
  QUERY_RESULT_SUBJECT_IRI,
} from "@graviola/edb-core-utils";

export { QUERY_RESULT_SUBJECT_IRI };
/** @deprecated misspelling kept for back-compat — use GRAVIOLA_ONTOLOGY_IRI from @graviola/edb-core-types. */
export const GRAVOILA_ONTOLOGY_IRI = GRAVIOLA_ONTOLOGY_IRI;
export const QUERY_RESULT_SUBJECT_IRI_NODE = df.namedNode(
  QUERY_RESULT_SUBJECT_IRI,
);

export type OptionalStringOrStringArray = string | string[] | undefined | null;

export const isNilOrEmpty = (
  value: OptionalStringOrStringArray,
): value is undefined | null => {
  return isNil(value) || (Array.isArray(value) && value.length === 0);
};
