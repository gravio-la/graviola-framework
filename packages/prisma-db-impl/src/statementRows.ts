import type { StatementNode, StatementWrite } from "@graviola/provenance-types";
import { statementValueHash } from "@graviola/statement-meta";

/** Prisma `GraviolaStatement` row shape (generated client). */
export type GraviolaStatementRow = {
  id: string;
  entityIri: string;
  typeName: string;
  path: string;
  valueHash: string;
  valueJson: string;
  rank?: string | null;
  source?: string | null;
  generatedAt?: Date | null;
  formulaId?: string | null;
  stratum?: number | null;
  inputFingerprint?: string | null;
  agent?: string | null;
  extensionsJson?: string | null;
};

export function statementRowId(
  entityIri: string,
  path: string,
  value: StatementWrite["value"],
): string {
  return `${entityIri}#${path}/stmt/${statementValueHash(value)}`;
}

export function statementRowFromWrite(
  typeName: string,
  entityIri: string,
  write: StatementWrite,
): GraviolaStatementRow {
  const { path, value, statement } = write;
  const hash = statementValueHash(value);
  const wasGeneratedBy = statement.wasGeneratedBy;
  const generatedAt =
    statement.generatedAt != null
      ? new Date(statement.generatedAt)
      : wasGeneratedBy?.generatedAt != null
        ? new Date(wasGeneratedBy.generatedAt)
        : null;

  return {
    id: statementRowId(entityIri, path, value),
    entityIri,
    typeName,
    path,
    valueHash: hash,
    valueJson: JSON.stringify(value),
    rank: statement.rank ?? null,
    source: statement.source ?? null,
    generatedAt,
    formulaId: wasGeneratedBy?.formulaId ?? null,
    stratum: wasGeneratedBy?.stratum ?? null,
    inputFingerprint: wasGeneratedBy?.inputFingerprint ?? null,
    agent: wasGeneratedBy?.agent ?? null,
    extensionsJson:
      statement.qualifiers != null
        ? JSON.stringify(statement.qualifiers)
        : null,
  };
}

export function statementNodeFromRow(row: GraviolaStatementRow): StatementNode {
  const value = JSON.parse(row.valueJson) as StatementNode["value"];
  const hasGeneration =
    row.formulaId != null ||
    row.stratum != null ||
    row.inputFingerprint != null ||
    row.agent != null;

  const node: StatementNode = {
    value,
    ...(row.rank ? { rank: row.rank as StatementNode["rank"] } : {}),
    ...(row.source ? { source: row.source } : {}),
    ...(row.generatedAt ? { generatedAt: row.generatedAt.toISOString() } : {}),
  };

  if (hasGeneration) {
    node.wasGeneratedBy = {
      ...(row.formulaId ? { formulaId: row.formulaId } : {}),
      ...(row.stratum != null ? { stratum: row.stratum } : {}),
      ...(row.inputFingerprint
        ? { inputFingerprint: row.inputFingerprint }
        : {}),
      ...(row.agent ? { agent: row.agent } : {}),
      ...(row.generatedAt
        ? { generatedAt: row.generatedAt.toISOString() }
        : {}),
    };
  }

  if (row.extensionsJson) {
    node.qualifiers = JSON.parse(row.extensionsJson) as Record<string, unknown>;
  }

  return node;
}

export function groupStatementRowsByPath(
  rows: GraviolaStatementRow[],
): Record<string, StatementNode[]> {
  const out: Record<string, StatementNode[]> = {};
  for (const row of rows) {
    const node = statementNodeFromRow(row);
    const list = out[row.path] ?? [];
    list.push(node);
    out[row.path] = list;
  }
  return out;
}
