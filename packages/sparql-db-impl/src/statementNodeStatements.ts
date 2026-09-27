import df from "@rdfjs/data-model";
import { sparql } from "@tpluscode/rdf-string";
import { STATEMENT_PERSISTENCE_SUFFIX } from "@graviola/statement-meta";
import { withDefaultPrefix } from "@graviola/sparql-schema";

function named(iri: string) {
  return df.namedNode(iri);
}

/**
 * Remove every persisted statement sidecar blank-node subgraph for an entity
 * (`*__stmt` predicates). Run before re-persisting statement history so
 * orphaned blank nodes from prior writes do not accumulate.
 */
export function buildStatementNodeSidecarDelete(
  entityIRI: string,
  defaultPrefix: string,
): string {
  const entity = named(entityIRI);
  const stmtProp = df.variable("stmtProp");
  const stmtNode = df.variable("stmtNode");
  const sp = df.variable("sp");
  const so = df.variable("so");
  const nested = df.variable("nested");
  const np = df.variable("np");
  const no = df.variable("no");
  const suffix = STATEMENT_PERSISTENCE_SUFFIX;

  const body = sparql`
DELETE {
  ${entity} ${stmtProp} ${stmtNode} .
  ${stmtNode} ${sp} ${so} .
  ${nested} ${np} ${no} .
}
WHERE {
  ${entity} ${stmtProp} ${stmtNode} .
  FILTER(STRENDS(STR(${stmtProp}), ${df.literal(suffix)}))
  ${stmtNode} ${sp} ${so} .
  OPTIONAL {
    ${stmtNode} ?link ${nested} .
    FILTER(isBlank(${nested}))
    ${nested} ${np} ${no} .
  }
}`;

  return withDefaultPrefix(defaultPrefix, body.toString());
}
