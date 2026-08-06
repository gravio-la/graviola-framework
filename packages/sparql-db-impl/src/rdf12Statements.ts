import {
  PROV,
  RDF,
  STMT,
  type StatementNode,
  type StatementValue,
  type StatementWrite,
} from "@graviola/provenance-types";
import { statementValueHash } from "@graviola/statement-meta";

export function toSparqlLiteral(value: StatementValue): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") {
    return `"${value}"^^<http://www.w3.org/2001/XMLSchema#boolean>`;
  }
  if (Number.isInteger(value)) {
    return `"${value}"^^<http://www.w3.org/2001/XMLSchema#integer>`;
  }
  return `"${value}"^^<http://www.w3.org/2001/XMLSchema#decimal>`;
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
  return `
DELETE {
  <${entityIRI}> <${propertyIRI}> ?oldV .
  ?r ?mp ?mo .
}
WHERE {
  ?r <${STMT.about}> <${entityIRI}> ;
     <${STMT.path}> ${JSON.stringify(path)} ;
     <${STMT.valueHash}> ${JSON.stringify(valueHash)} .
  ?r ?mp ?mo .
  OPTIONAL { <${entityIRI}> <${propertyIRI}> ?oldV . }
}`.trim();
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
  const valueLiteral = toSparqlLiteral(write.value);
  const hash = statementValueHash(write.value);
  const stmt = write.statement;

  const metaTriples: string[] = [
    `_:r <${STMT.about}> <${entityIRI}> ;`,
    `    <${STMT.path}> ${JSON.stringify(path)} ;`,
    `    <${STMT.valueHash}> ${JSON.stringify(hash)} ;`,
    `    <${STMT.value}> ${valueLiteral} .`,
  ];

  if (stmt.rank) {
    metaTriples.push(`_:r <${STMT.rank}> ${JSON.stringify(stmt.rank)} .`);
  }
  if (stmt.source) {
    metaTriples.push(`_:r <${STMT.source}> ${JSON.stringify(stmt.source)} .`);
  }
  if (stmt.generatedAt) {
    metaTriples.push(
      `_:r <${PROV.generatedAtTime}> ${JSON.stringify(stmt.generatedAt)} .`,
    );
  }
  const activity = stmt.wasGeneratedBy;
  if (activity?.formulaId) {
    metaTriples.push(
      `_:r <https://graviola.gra.one/ns/formulaId> ${JSON.stringify(activity.formulaId)} .`,
    );
  }
  if (activity?.lensId) {
    metaTriples.push(
      `_:r <https://graviola.gra.one/ns/lensId> ${JSON.stringify(activity.lensId)} .`,
    );
  }
  if (activity?.stratum !== undefined) {
    metaTriples.push(
      `_:r <https://graviola.gra.one/ns/stratum> ${JSON.stringify(String(activity.stratum))} .`,
    );
  }
  if (activity?.inputFingerprint) {
    metaTriples.push(
      `_:r <https://graviola.gra.one/ns/inputFingerprint> ${JSON.stringify(activity.inputFingerprint)} .`,
    );
  }
  if (activity?.agent) {
    metaTriples.push(
      `_:r <${PROV.wasAttributedTo}> ${JSON.stringify(activity.agent)} .`,
    );
  }
  if (activity?.generatedAt) {
    metaTriples.push(
      `_:r <${PROV.generatedAtTime}> ${JSON.stringify(activity.generatedAt)} .`,
    );
  }

  const tripleTerm =
    options?.includeTripleTerm !== false
      ? `_:r <${RDF.reifies}> <<( <${entityIRI}> <${propertyIRI}> ${valueLiteral} )>> .\n`
      : "";

  return `
INSERT DATA {
  <${entityIRI}> <${propertyIRI}> ${valueLiteral} .
  ${tripleTerm}${metaTriples.join("\n  ")}
}`.trim();
}

export function buildRdf12StatementSelect(
  entityIRI: string,
  paths?: string[],
): string {
  const valuesFilter =
    paths && paths.length
      ? `VALUES ?path { ${paths.map((p) => JSON.stringify(p)).join(" ")} }`
      : "";
  return `
SELECT ?path ?mp ?mo ?r WHERE {
  ?r <${STMT.about}> <${entityIRI}> ;
     <${STMT.path}> ?path .
  ?r ?mp ?mo .
  ${valuesFilter}
}`.trim();
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
      value: entry.fields[STMT.value] ?? "",
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
