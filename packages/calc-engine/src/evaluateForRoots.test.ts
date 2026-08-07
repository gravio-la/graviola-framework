import { describe, expect, it } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import { selectLiveEvalSlots } from "@graviola/formula-runtime";
import type { StatementNode } from "@graviola/provenance-types";
import { evaluateForRoots } from "./evaluateForRoots";
import {
  climbAffectedRoots,
  dirtyScopesForChange,
  discoverRelationEdges,
} from "./delta";
import {
  assertPushdownEqualsJs,
  computeAggregateInJs,
  SERVER_CALC_HOST,
  tryPushdownAggregates,
} from "./pushdown";
import { warm } from "./warm";

describe("evaluateForRoots", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("issues one query and evaluates a batch", async () => {
    let filterCalls = 0;
    const store = {
      filterMany: async () => {
        filterCalls += 1;
        return [
          gardenFeeSampleData as Record<string, unknown>,
          {
            ...(gardenFeeSampleData as Record<string, unknown>),
            "@id": "https://example.org/garden/2",
            fee_rate_per_sqm: 3,
          },
        ];
      },
    };

    const result = await evaluateForRoots(
      store,
      profile,
      "Garden",
      gardenFeeSchema,
      {
        rootIRIs: [
          "https://example.org/garden/1",
          "https://example.org/garden/2",
        ],
      },
    );

    expect(result.queriesIssued).toBe(1);
    expect(filterCalls).toBe(1);
    expect(result.values).toHaveLength(2);
    expect(result.values[0]!.annual_fee).toBe(
      gardenFeeExpected.gardenAnnualFee,
    );
    expect(result.plan.depth).toBe(2);
  });
});

describe("warm", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("writes per owning entity and re-warm issues zero writes", async () => {
    const statements = new Map<string, Record<string, StatementNode[]>>();
    let writes = 0;

    const store = {
      filterMany: async () => [
        structuredClone(gardenFeeSampleData) as Record<string, unknown>,
      ],
      writeStatements: async (
        typeName: string,
        entityIRI: string,
        batch: { path: string; value: unknown; statement: StatementNode }[],
      ) => {
        writes += batch.length;
        const key = `${typeName}::${entityIRI}`;
        const existing = statements.get(key) ?? {};
        for (const w of batch) {
          existing[w.path] = [w.statement];
        }
        statements.set(key, existing);
      },
      loadStatements: async (typeName: string, entityIRI: string) => {
        return statements.get(`${typeName}::${entityIRI}`) ?? {};
      },
    };

    const first = await warm(store, profile, "Garden", gardenFeeSchema, {
      rootIRIs: ["https://example.org/garden/1"],
      agent: "http://ex/agent",
    });
    expect(first.queriesIssued).toBe(1);
    expect(first.writesIssued).toBeGreaterThan(0);
    expect(first.warmed).toBeGreaterThan(0);

    const writesAfterFirst = writes;

    const second = await warm(store, profile, "Garden", gardenFeeSchema, {
      rootIRIs: ["https://example.org/garden/1"],
      skipFresh: true,
    });
    expect(second.writesIssued).toBe(0);
    expect(second.skippedFresh).toBeGreaterThan(0);
    expect(writes).toBe(writesAfterFirst);

    // Garden annual_fee materialized
    const gardenStmts = statements.get("Garden::https://example.org/garden/1");
    expect(
      gardenStmts?.annual_fee?.[0]?.wasGeneratedBy?.inputFingerprint,
    ).toBeTruthy();
  });
});

describe("dirtyScopesForChange + climbAffectedRoots", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("collects exactly the three Plot→Patch→Garden affected slots", () => {
    const scopes = dirtyScopesForChange(profile, "Plot");
    expect(scopes).toEqual(
      expect.arrayContaining([
        "#/definitions/Plot/properties/billable_area",
        "#/definitions/Patch/properties/billable_area_total",
        "#/definitions/Garden/properties/total_billable",
      ]),
    );
    // annual_fee depends on total_billable
    expect(scopes).toContain("#/definitions/Garden/properties/annual_fee");
  });

  it("discovers Garden→Patch→Plot edges", () => {
    const edges = discoverRelationEdges(gardenFeeSchema);
    expect(edges).toContainEqual({
      parentTypeName: "Garden",
      childTypeName: "Patch",
      edgeProperty: "patch",
    });
    expect(edges).toContainEqual({
      parentTypeName: "Patch",
      childTypeName: "Plot",
      edgeProperty: "plots",
    });
  });

  it("climbs Plot → Garden with depth-bounded query count", async () => {
    let queries = 0;
    const planner = {
      findParents: async (args: {
        childTypeName: string;
        childIRIs: string[];
        parentTypeName: string;
        edgeProperty: string;
      }) => {
        queries += 1;
        if (
          args.childTypeName === "Plot" &&
          args.parentTypeName === "Patch" &&
          args.edgeProperty === "plots"
        ) {
          return ["https://example.org/patch/1"];
        }
        if (
          args.childTypeName === "Patch" &&
          args.parentTypeName === "Garden" &&
          args.edgeProperty === "patch"
        ) {
          return ["https://example.org/garden/1"];
        }
        return [];
      },
    };

    const result = await climbAffectedRoots({
      domainSchema: gardenFeeSchema,
      planner,
      childTypeName: "Plot",
      childIRIs: ["https://example.org/plot/1"],
      rootTypeName: "Garden",
    });

    expect(result.rootIRIs).toEqual(["https://example.org/garden/1"]);
    // One query per hop (Plot→Patch, Patch→Garden) — independent of N gardens
    expect(result.queriesIssued).toBe(2);
    expect(queries).toBe(2);
  });
});

describe("pushdown + placement", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
  const patchSlot =
    profile.slots["#/definitions/Patch/properties/billable_area_total"]!;

  it("returns pushed:false when capability is absent", async () => {
    const results = await tryPushdownAggregates(
      { canPushdownAggregates: false },
      profile,
      [
        {
          slot: patchSlot,
          scope: "#/definitions/Patch/properties/billable_area_total",
          subjectIRIs: ["https://example.org/patch/1"],
        },
      ],
      SERVER_CALC_HOST,
    );
    expect(results[0]!.pushed).toBe(false);
  });

  it("JS reference matches garden-fee patch total", () => {
    const evaluated = {
      "@id": "https://example.org/patch/1",
      plots: [{ billable_area: 20 }, { billable_area: 18 }],
    };
    expect(computeAggregateInJs(patchSlot, evaluated)).toBe(
      gardenFeeExpected.patchTotal,
    );
  });

  it("differential: native pushdown equals JS reference", async () => {
    const patchEntity = {
      "@id": "https://example.org/patch/1",
      plots: [{ billable_area: 20 }, { billable_area: 18 }],
    };
    const capability = {
      canPushdownAggregates: true,
      evaluateAggregate: async () => gardenFeeExpected.patchTotal,
    };
    const cmp = await assertPushdownEqualsJs(capability, profile, [
      {
        slot: patchSlot,
        scope: "#/definitions/Patch/properties/billable_area_total",
        subjectIRIs: ["https://example.org/patch/1"],
        entities: [patchEntity],
      },
    ]);
    expect(cmp[0]!.equal).toBe(true);
    expect(cmp[0]!.native).toBe(gardenFeeExpected.patchTotal);
  });

  it("SERVER_CALC_HOST keeps all garden-fee slots live", () => {
    const live = selectLiveEvalSlots(profile, SERVER_CALC_HOST);
    expect(Object.keys(live.slots).length).toBe(
      Object.keys(profile.slots).length,
    );
  });
});
