import df from "@rdfjs/data-model";
import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
import { sparql } from "@tpluscode/rdf-string";
import {
  PROV,
  RDF,
  STMT,
  type StatementNode,
  type StatementValue,
  type StatementWrite,
} from "@graviola/provenance-types";
import {
  normalizeStatementValue,
  statementValueHash,
} from "@graviola/statement-meta";

function named(iri: string): NamedNode {
  return df.namedNode(iri);
}

function statementValueLiteral(value: StatementValue): Literal {
  if (typeof value === "string") {
    return df.literal(value);
  }
  if (typeof value === "boolean") {
    return df.literal(value);
  }
  if (Number.isInteger(value)) {
    return df.literal(String(value), xsd.integer);
  }
  return df.literal(String(value), xsd.decimal);
}

/** SPARQL literal for a {@link StatementValue} (escape-safe via `@tpluscode/rdf-string`). */
export function toSparqlLiteral(value: StatementValue): string {
  return sparql`${statementValueLiteral(value)}`.toString();
}

/**
 * RDF 1.2 triple term `<<( s p o )>>` — not supported by `@tpluscode/rdf-string`;
 * components are rendered through `sparql` before wrapping.
 */
function rdf12TripleTerm(
  subject: NamedNode,
  predicate: NamedNode,
  object: Literal,
): string {
  const term = (node: NamedNode | Literal) =>
    sparql`${node}`
      .toString()
      .replace(/^PREFIX[^\n]*\n/gm, "")
      .trim();
  return `<<( ${term(subject)} ${term(predicate)} ${term(object)} )>>`;
}

type SparqlPattern = ReturnType<typeof sparql>;

function appendPattern(
  body: SparqlPattern,
  line: SparqlPattern,
): SparqlPattern {
  return sparql`${body}\n  ${line}`;
}

export function propertyIriFromPath(
  defaultPrefix: string,
  path: string,
): string {
  const leaf = path.split(".").pop() ?? path;
  if (leaf.includes(":")) return leaf;
  return `${defaultPrefix}${leaf}`;
}

export function buildRdf12StatementDelete(
  entityIRI: string,
  propertyIRI: string,
  path: string,
  valueHash: string,
): string {
  const entity = named(entityIRI);
  const property = named(propertyIRI);
  const r = df.variable("r");
  const mp = df.variable("mp");
  const mo = df.variable("mo");
  const oldV = df.variable("oldV");

  return sparql`
DELETE {
  ${entity} ${property} ${oldV} .
  ${r} ${mp} ${mo} .
}
WHERE {
  ${r} ${named(STMT.about)} ${entity} ;
     ${named(STMT.path)} ${df.literal(path)} ;
     ${named(STMT.valueHash)} ${df.literal(valueHash)} .
  ${r} ${mp} ${mo} .
  OPTIONAL { ${entity} ${property} ${oldV} . }
}`.toString();
}

export type Rdf12InsertOptions = {
  includeTripleTerm?: boolean;
};

export function buildRdf12StatementInsert(
  entityIRI: string,
  propertyIRI: string,
  path: string,
  write: StatementWrite,
  options?: Rdf12InsertOptions,
): string {
  const entity = named(entityIRI);
  const property = named(propertyIRI);
  const valueLit = statementValueLiteral(write.value);
  const hash = statementValueHash(write.value);
  const reifier = df.blankNode("r");
  const stmt = write.statement;

  let body: SparqlPattern = sparql`${entity} ${property} ${valueLit} .`;

  if (options?.includeTripleTerm !== false) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named(RDF.reifies)} ${sparql`${rdf12TripleTerm(entity, property, valueLit)}`} .`,
    );
  }

  body = appendPattern(
    body,
    sparql`
      ${reifier} ${named(STMT.about)} ${entity} ;
                 ${named(STMT.path)} ${df.literal(path)} ;
                 ${named(STMT.valueHash)} ${df.literal(hash)} ;
                 ${named(STMT.value)} ${valueLit} .
    `,
  );

  if (stmt.rank) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named(STMT.rank)} ${df.literal(stmt.rank)} .`,
    );
  }
  if (stmt.source) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named(STMT.source)} ${df.literal(stmt.source)} .`,
    );
  }
  if (stmt.generatedAt) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named(PROV.generatedAtTime)} ${df.literal(stmt.generatedAt)} .`,
    );
  }

  const activity = stmt.wasGeneratedBy;
  if (activity?.formulaId) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named("https://graviola.gra.one/ns/formulaId")} ${df.literal(activity.formulaId)} .`,
    );
  }
  if (activity?.lensId) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named("https://graviola.gra.one/ns/lensId")} ${df.literal(activity.lensId)} .`,
    );
  }
  if (activity?.stratum !== undefined) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named("https://graviola.gra.one/ns/stratum")} ${df.literal(String(activity.stratum))} .`,
    );
  }
  if (activity?.inputFingerprint) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named("https://graviola.gra.one/ns/inputFingerprint")} ${df.literal(activity.inputFingerprint)} .`,
    );
  }
  if (activity?.agent) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named(PROV.wasAttributedTo)} ${df.literal(activity.agent)} .`,
    );
  }
  if (activity?.generatedAt) {
    body = appendPattern(
      body,
      sparql`${reifier} ${named(PROV.generatedAtTime)} ${df.literal(activity.generatedAt)} .`,
    );
  }

  return sparql`INSERT DATA { ${body} }`.toString();
}

export function buildRdf12StatementSelect(
  entityIRI: string,
  paths?: string[],
): string {
  const entity = named(entityIRI);
  const r = df.variable("r");
  const pathVar = df.variable("path");
  const mp = df.variable("mp");
  const mo = df.variable("mo");

  if (paths?.length) {
    const pathLits = paths.map((p) => df.literal(p));
    return sparql`
SELECT ?path ?mp ?mo ?r WHERE {
  ${r} ${named(STMT.about)} ${entity} ;
     ${named(STMT.path)} ${pathVar} .
  ${r} ${mp} ${mo} .
  VALUES ?path { ${pathLits} }
}`.toString();
  }

  return sparql`
SELECT ?path ?mp ?mo ?r WHERE {
  ${r} ${named(STMT.about)} ${entity} ;
     ${named(STMT.path)} ${pathVar} .
  ${r} ${mp} ${mo} .
}`.toString();
}

type SparqlBinding = {
  value?: string;
  type?: string;
};

type SparqlBindingsRow = Record<string, SparqlBinding>;

export function parseRdf12StatementBindings(
  bindings: SparqlBindingsRow[],
): Record<string, StatementNode[]> {
  const byReifier = new Map<
    string,
    { path?: string; fields: Record<string, string> }
  >();

  for (const row of bindings) {
    const r = row.r?.value;
    if (!r) continue;
    const entry = byReifier.get(r) ?? { fields: {} };
    if (row.path?.value) entry.path = row.path.value;
    const mp = row.mp?.value;
    const mo = row.mo?.value;
    if (mp && mo) entry.fields[mp] = mo;
    byReifier.set(r, entry);
  }

  const out: Record<string, StatementNode[]> = {};
  for (const entry of byReifier.values()) {
    if (!entry.path) continue;
    const node: StatementNode = {
      value: normalizeStatementValue(entry.fields[STMT.value] ?? ""),
    };
    if (entry.fields[STMT.rank]) {
      node.rank = entry.fields[STMT.rank] as StatementNode["rank"];
    }
    if (entry.fields[STMT.source]) node.source = entry.fields[STMT.source];
    if (entry.fields[PROV.generatedAtTime]) {
      node.generatedAt = entry.fields[PROV.generatedAtTime];
    }
    const wasGeneratedBy: Record<string, unknown> = {};
    if (entry.fields["https://graviola.gra.one/ns/formulaId"]) {
      wasGeneratedBy.formulaId =
        entry.fields["https://graviola.gra.one/ns/formulaId"];
    }
    if (entry.fields["https://graviola.gra.one/ns/stratum"]) {
      wasGeneratedBy.stratum = Number(
        entry.fields["https://graviola.gra.one/ns/stratum"],
      );
    }
    if (entry.fields["https://graviola.gra.one/ns/inputFingerprint"]) {
      wasGeneratedBy.inputFingerprint =
        entry.fields["https://graviola.gra.one/ns/inputFingerprint"];
    }
    if (Object.keys(wasGeneratedBy).length) {
      node.wasGeneratedBy = wasGeneratedBy as StatementNode["wasGeneratedBy"];
    }

    out[entry.path] = [...(out[entry.path] ?? []), node];
  }

  return out;
}
