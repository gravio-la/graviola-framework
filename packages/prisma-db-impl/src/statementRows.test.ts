import { describe, expect, test } from "bun:test";
import type { StatementWrite } from "@graviola/provenance-types";
import { statementValueHash } from "@graviola/statement-meta";
import {
  groupStatementRowsByPath,
  statementNodeFromRow,
  statementRowFromWrite,
  statementRowId,
} from "./statementRows";

describe("statementRows", () => {
  test("statementRowId is stable for entity/path/value", () => {
    expect(statementRowId("http://ex/a", "price", 42)).toBe(
      `http://ex/a#price/stmt/${statementValueHash(42)}`,
    );
  });

  test("statementRowFromWrite maps generation activity and qualifiers", () => {
    const write: StatementWrite = {
      path: "billing.total",
      value: 99.5,
      statement: {
        rank: "preferred",
        source: "calc",
        generatedAt: "2026-01-15T12:00:00.000Z",
        wasGeneratedBy: {
          formulaId: "f1",
          stratum: 2,
          inputFingerprint: "abc",
          agent: "http://ex/agent",
        },
        qualifiers: { note: "rounded" },
      },
    };
    const row = statementRowFromWrite("Invoice", "http://ex/inv/1", write);
    expect(row.path).toBe("billing.total");
    expect(row.valueJson).toBe("99.5");
    expect(row.formulaId).toBe("f1");
    expect(row.extensionsJson).toBe(JSON.stringify({ note: "rounded" }));
  });

  test("statementNodeFromRow round-trips write payload", () => {
    const write: StatementWrite = {
      path: "price",
      value: "EUR 10",
      statement: {
        source: "manual",
        generatedAt: "2026-02-01T08:30:00.000Z",
        wasGeneratedBy: { formulaId: "fx" },
      },
    };
    const row = statementRowFromWrite("Item", "http://ex/i", write);
    const node = statementNodeFromRow(row);
    expect(node.value).toBe("EUR 10");
    expect(node.source).toBe("manual");
    expect(node.wasGeneratedBy?.formulaId).toBe("fx");
  });

  test("groupStatementRowsByPath groups multiple values per path", () => {
    const rows = [
      statementRowFromWrite("T", "http://ex/e", {
        path: "x",
        value: 1,
        statement: {},
      }),
      statementRowFromWrite("T", "http://ex/e", {
        path: "x",
        value: 2,
        statement: {},
      }),
      statementRowFromWrite("T", "http://ex/e", {
        path: "y",
        value: true,
        statement: {},
      }),
    ];
    const grouped = groupStatementRowsByPath(rows);
    expect(grouped.x?.length).toBe(2);
    expect(grouped.y?.length).toBe(1);
  });
});
