import { describe, expect, test } from "bun:test";
import { buildStatementNodeSidecarDelete } from "./statementNodeStatements";

describe("buildStatementNodeSidecarDelete", () => {
  test("targets __stmt sidecar predicates on the entity", () => {
    const query = buildStatementNodeSidecarDelete(
      "http://example.org/test#Item/x",
      "http://example.org/test#",
    );
    expect(query).toContain("http://example.org/test#Item/x");
    expect(query).toContain('STRENDS(STR(?stmtProp), "__stmt")');
    expect(query).toContain("DELETE");
  });
});
