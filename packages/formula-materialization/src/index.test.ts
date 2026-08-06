import { describe, expect, it } from "bun:test";
import {
  compileCalcProfile,
  gardenFeeSchema,
  gardenFeeSidecar,
  gardenFeeSampleData,
} from "@graviola/formula-dependency";
import type { StatementNode } from "@graviola/provenance-types";
import {
  buildMaterializationPlan,
  buildStatementWrites,
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

  it("isMaterializationFresh matches fingerprint on hot fields", () => {
    const fresh: StatementNode[] = [
      {
        value: 1,
        wasGeneratedBy: { inputFingerprint: "fp-1" },
      },
    ];
    const stale: StatementNode[] = [
      {
        value: 1,
        wasGeneratedBy: { inputFingerprint: "fp-old" },
      },
    ];
    expect(isMaterializationFresh(fresh, "fp-1")).toBe(true);
    expect(isMaterializationFresh(stale, "fp-1")).toBe(false);
    expect(isMaterializationFresh([], "fp-1")).toBe(false);
  });
});
