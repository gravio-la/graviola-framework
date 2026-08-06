import type { StatementNode, StatementWrite } from "@graviola/provenance-types";
import type { SchemaRegistry } from "../registry";

/**
 * Fact-level statement metadata (Wikidata statement-node model).
 * Statements are system-mediated: plain `upsert` strips client `$stmt`;
 * this facet is the only entry point. Dual assertion: each write also
 * asserts the truthy value at `path`.
 */
export interface Statements<R extends SchemaRegistry> {
  writeStatements<T extends keyof R & string>(
    typeName: T,
    entityIRI: string,
    writes: StatementWrite[],
  ): Promise<void>;

  /** Statements per dot path; all annotated paths when `paths` omitted. */
  loadStatements<T extends keyof R & string>(
    typeName: T,
    entityIRI: string,
    paths?: string[],
  ): Promise<Record<string, StatementNode[]>>;
}
