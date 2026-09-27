import { describe, expect, test } from "bun:test";
import {
  compareStatementRecency,
  currentStatement,
  generationActivityToPredicates,
  PROV,
  RDF,
  STMT,
  type StatementNode,
} from "./index";

describe("generationActivityToPredicates", () => {
  test("emits gra and prov keys for a full activity", () => {
    const out = generationActivityToPredicates({
      formulaId: "#/properties/total",
      stratum: 2,
      inputFingerprint: "sha256-abc",
      generatedAt: "2026-08-06T09:00:00.000Z",
      agent: "https://example.org/agent",
    });
    expect(out["gra:formulaId"]).toBe("#/properties/total");
    expect(out["gra:stratum"]).toBe(2);
    expect(out["gra:inputFingerprint"]).toBe("sha256-abc");
    expect(out[PROV.generatedAtTime]).toBe("2026-08-06T09:00:00.000Z");
    expect(out[PROV.wasAttributedTo]).toBe("https://example.org/agent");
  });

  test("returns empty object for empty activity", () => {
    expect(generationActivityToPredicates({})).toEqual({});
  });
});

describe("vocabulary constants", () => {
  test("RDF.reifies IRI", () => {
    expect(RDF.reifies).toBe(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies",
    );
  });

  test("STMT.about IRI", () => {
    expect(STMT.about).toBe("https://graviola.gra.one/ns/stmt/about");
  });
});

describe("currentStatement", () => {
  const node = (value: number, generatedAt?: string): StatementNode =>
    ({ value, generatedAt }) as StatementNode;

  test("returns the node with the latest generatedAt, regardless of order", () => {
    const newer = node(2, "2026-01-02T00:00:00.000Z");
    const older = node(1, "2026-01-01T00:00:00.000Z");
    expect(currentStatement([newer, older])).toBe(newer);
    expect(currentStatement([older, newer])).toBe(newer);
  });

  test("falls back to the last node without timestamps and is undefined when empty", () => {
    const a = node(1);
    const b = node(2);
    expect(currentStatement([a, b])).toBe(b);
    expect(currentStatement([])).toBeUndefined();
  });
});

describe("compareStatementRecency", () => {
  test("orders by generatedAt and returns 0 when a timestamp is missing", () => {
    const older = {
      value: 1,
      generatedAt: "2026-01-01T00:00:00.000Z",
    } as StatementNode;
    const newer = {
      value: 2,
      generatedAt: "2026-01-02T00:00:00.000Z",
    } as StatementNode;
    const untimed = { value: 3 } as StatementNode;
    expect(compareStatementRecency(older, newer)).toBeLessThan(0);
    expect(compareStatementRecency(newer, older)).toBeGreaterThan(0);
    expect(compareStatementRecency(untimed, newer)).toBe(0);
  });
});
