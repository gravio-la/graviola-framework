import { describe, expect, it } from "bun:test";
import {
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import type { StatementNode } from "@graviola/provenance-types";
import {
  buildMaterializationPlan,
  buildStatementWrites,
  currentStatement,
  isMaterializationFresh,
  planInvalidation,
  scopeToDotPath,
} from "./index";

describe("formula-materialization", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("orders dependents by stratum after dirty plot field", () => {
    const scopes = planInvalidation(
      profile,
      "#/definitions/Plot/properties/billable_area",
    );
    expect(scopes.length).toBeGreaterThan(0);
    const strata = scopes.map((s) => profile.slots[s]?.stratum ?? 0);
    expect(strata).toEqual([...strata].sort((a, b) => a - b));
  });

  it("builds materialization plan with provenance", () => {
    const plan = buildMaterializationPlan(
      profile,
      gardenFeeSampleData as Record<string, unknown>,
      "#/definitions/Plot/properties/billable_area",
      "sha256-test",
    );
    expect(plan.values.length).toBeGreaterThan(0);
    expect(plan.values[0]?.wasGeneratedBy.formulaId).toBeDefined();
    expect(plan.values[0]?.wasGeneratedBy.stratum).toBeGreaterThan(0);
  });

  it("scopeToDotPath maps one- and two-level property scopes", () => {
    expect(scopeToDotPath("#/definitions/Garden/properties/annual_fee")).toBe(
      "annual_fee",
    );
    expect(scopeToDotPath("#/properties/billing/properties/total")).toBe(
      "billing.total",
    );
  });

  it("buildStatementWrites carries stratum, fingerprint, and formulaId", () => {
    const plan = {
      dirtyScope: "#/definitions/Garden/properties/annual_fee",
      orderedScopes: ["#/definitions/Garden/properties/annual_fee"],
      values: [
        {
          scope: "#/definitions/Garden/properties/annual_fee",
          value: 1200,
          wasGeneratedBy: {
            formulaId: "#/definitions/Garden/properties/annual_fee",
            stratum: 3,
            inputFingerprint: "fp-abc",
            generatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
    };
    const writes = buildStatementWrites(plan, { agent: "http://ex/agent" });
    expect(writes).toHaveLength(1);
    const first = writes[0]!;
    expect(first.path).toBe("annual_fee");
    expect(first.value).toBe(1200);
    expect(first.statement.wasGeneratedBy?.stratum).toBe(3);
    expect(first.statement.wasGeneratedBy?.inputFingerprint).toBe("fp-abc");
    expect(first.statement.wasGeneratedBy?.formulaId).toBe(
      "#/definitions/Garden/properties/annual_fee",
    );
    expect(first.statement.wasGeneratedBy?.agent).toBe("http://ex/agent");
  });

  it("buildStatementWrites throws for non-primitive materialized values", () => {
    const plan = {
      dirtyScope: "#/definitions/X/properties/y",
      orderedScopes: ["#/definitions/X/properties/y"],
      values: [
        {
          scope: "#/definitions/X/properties/y",
          value: { nested: true },
          wasGeneratedBy: {
            formulaId: "#/definitions/X/properties/y",
            generatedAt: new Date().toISOString(),
          },
        },
      ],
    };
    expect(() => buildStatementWrites(plan)).toThrow(/non-primitive/);
  });

  it("checks freshness against only the latest statement", () => {
    const statements: StatementNode[] = [
      {
        value: 1,
        generatedAt: "2026-01-01T00:00:00.000Z",
        wasGeneratedBy: { inputFingerprint: "fp-a" },
      },
      {
        value: 2,
        generatedAt: "2026-01-02T00:00:00.000Z",
        wasGeneratedBy: { inputFingerprint: "fp-b" },
      },
    ];

    expect(isMaterializationFresh(statements, "fp-b")).toBe(true);
    expect(isMaterializationFresh(statements, "fp-a")).toBe(false);
  });

  it("keeps single-statement freshness behavior", () => {
    const statements: StatementNode[] = [
      {
        value: 1,
        wasGeneratedBy: { inputFingerprint: "fp-1" },
      },
    ];

    expect(isMaterializationFresh(statements, "fp-1")).toBe(true);
    expect(isMaterializationFresh(statements, "fp-old")).toBe(false);
    expect(isMaterializationFresh([], "fp-1")).toBe(false);
  });

  it("uses the last statement when generatedAt is missing", () => {
    const statements: StatementNode[] = [
      {
        value: 1,
        wasGeneratedBy: { inputFingerprint: "fp-a" },
      },
      {
        value: 2,
        wasGeneratedBy: { inputFingerprint: "fp-b" },
      },
    ];

    expect(isMaterializationFresh(statements, "fp-b")).toBe(true);
    expect(isMaterializationFresh(statements, "fp-a")).toBe(false);
  });

  it("uses the last statement when generatedAt is equal", () => {
    const generatedAt = "2026-01-01T00:00:00.000Z";
    const statements: StatementNode[] = [
      {
        value: 1,
        generatedAt,
        wasGeneratedBy: { inputFingerprint: "fp-a" },
      },
      {
        value: 2,
        generatedAt,
        wasGeneratedBy: { inputFingerprint: "fp-b" },
      },
    ];

    expect(isMaterializationFresh(statements, "fp-b")).toBe(true);
    expect(isMaterializationFresh(statements, "fp-a")).toBe(false);
  });
});

describe("currentStatement", () => {
  const node = (value: number, generatedAt?: string): StatementNode =>
    ({ value, generatedAt }) as StatementNode;

  it("returns the node with the latest generatedAt, regardless of order", () => {
    const newer = node(2, "2026-01-02T00:00:00.000Z");
    const older = node(1, "2026-01-01T00:00:00.000Z");
    expect(currentStatement([newer, older])).toBe(newer);
    expect(currentStatement([older, newer])).toBe(newer);
  });

  it("falls back to the last node without timestamps and is undefined when empty", () => {
    const a = node(1);
    const b = node(2);
    expect(currentStatement([a, b])).toBe(b);
    expect(currentStatement([])).toBeUndefined();
  });
});
