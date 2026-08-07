/** Graviola internal ontology namespace (query-layer bookkeeping terms). */
export const GRAVIOLA_ONTOLOGY_IRI = "http://graviola.gra.one/ontology#";

/**
 * Marker `rdf:type` stamped on each query-result subject by SPARQL CONSTRUCT
 * generation. Query-layer bookkeeping only — it must never surface as an
 * entity's `@type` in extracted documents.
 */
export const QUERY_RESULT_SUBJECT_IRI = `${GRAVIOLA_ONTOLOGY_IRI}QueryResultSubject`;
