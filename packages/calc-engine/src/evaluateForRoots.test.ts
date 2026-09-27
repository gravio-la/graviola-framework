import { describe, expect, it } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import {
  compileCalcProfile,
  type CompiledProfile,
  type CompiledSlot,
} from "@graviola/formula-dependency";
import { selectLiveEvalSlots } from "@graviola/formula-runtime";
import type { StatementNode } from "@graviola/provenance-types";
import type { EntityChangeEvent } from "@graviola/store-core";
import { evaluateForRoots } from "./evaluateForRoots";
import {
  climbAffectedRoots,
  dirtyScopesForChange,
  discoverRelationEdges,
  subscribeCalcInvalidation,
} from "./delta";
import {
  assertPushdownEqualsJs,
  computeAggregateInJs,
  SERVER_CALC_HOST,
  tryPushdownAggregates,
} from "./pushdown";
import { fingerprintForEntity, warm } from "./warm";

const GARDEN_IRI = "https://example.org/garden/1";
const PLOT_SERVER_SCOPE = "#/definitions/Plot/properties/billable_area";

function withSlotOverrides(
  profile: CompiledProfile,
  overrides: Record<string, Partial<CompiledSlot>>,
): CompiledProfile {
  const slots = { ...profile.slots };
  for (const [scope, patch] of Object.entries(overrides)) {
    const base = slots[scope];
    if (!base) continue;
    slots[scope] = { ...base, ...patch };
  }
  return { ...profile, slots };
}

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

    const first = await warm(
      store as never,
      profile,
      "Garden",
      gardenFeeSchema,
      {
        rootIRIs: ["https://example.org/garden/1"],
        agent: "http://ex/agent",
      },
    );
    expect(first.queriesIssued).toBe(1);
    expect(first.writesIssued).toBeGreaterThan(0);
    expect(first.warmed).toBeGreaterThan(0);

    const writesAfterFirst = writes;

    const second = await warm(
      store as never,
      profile,
      "Garden",
      gardenFeeSchema,
      {
        rootIRIs: ["https://example.org/garden/1"],
        skipFresh: true,
      },
    );
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

describe("fingerprintForEntity", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  function patchWithBillableAreas(): Record<string, unknown> {
    const patch = structuredClone(gardenFeeSampleData.patch) as Record<
      string,
      unknown
    >;
    const plots = patch.plots as Record<string, unknown>[];
    plots.forEach((plot, index) => {
      plot.billable_area = gardenFeeExpected.plotBillable[index];
    });
    return patch;
  }

  it("ignores filled statement sidecars", () => {
    const plain = patchWithBillableAreas();
    const withSidecars = structuredClone(plain);
    const plots = withSidecars.plots as Record<string, unknown>[];
    plots.forEach((plot, index) => {
      plot["billable_area$stmt"] = [
        {
          value: gardenFeeExpected.plotBillable[index],
          wasGeneratedBy: { generatedAt: `2026-09-27T00:00:0${index}Z` },
        },
      ];
    });

    expect(fingerprintForEntity(profile, "Patch", withSidecars)).toBe(
      fingerprintForEntity(profile, "Patch", plain),
    );
  });

  it("is independent of array result order", () => {
    const original = patchWithBillableAreas();
    const reordered = structuredClone(original);
    (reordered.plots as unknown[]).reverse();

    expect(fingerprintForEntity(profile, "Patch", reordered)).toBe(
      fingerprintForEntity(profile, "Patch", original),
    );
  });

  it("changes when a nested source value changes", () => {
    const original = patchWithBillableAreas();
    const changed = structuredClone(original);
    const plots = changed.plots as Record<string, unknown>[];
    plots[0]!.billable_area = 21;

    expect(fingerprintForEntity(profile, "Patch", changed)).not.toBe(
      fingerprintForEntity(profile, "Patch", original),
    );
  });

  it("resolves array paths element-wise", () => {
    const fingerprint = fingerprintForEntity(
      profile,
      "Patch",
      patchWithBillableAreas(),
    );

    expect(fingerprint).toContain("plots.billable_area=[20,18]");
    expect(fingerprint).not.toContain("plots.billable_area=undefined");
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

describe("subscribeCalcInvalidation", () => {
  const baseProfile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
  const profile = withSlotOverrides(baseProfile, {
    [PLOT_SERVER_SCOPE]: { eval: "server" },
  });
  const PLOT_IRI = "https://example.org/plot/1";

  it("passes host: SERVER_CALC_HOST so eval:server slots are materialized", async () => {
    const statements = new Map<string, Record<string, StatementNode[]>>();
    const listeners = new Set<(event: EntityChangeEvent) => void>();

    const store = {
      filterMany: async () => [
        structuredClone(gardenFeeSampleData) as Record<string, unknown>,
      ],
      writeStatements: async (
        typeName: string,
        entityIRI: string,
        batch: { path: string; value: unknown; statement: StatementNode }[],
      ) => {
        const key = `${typeName}::${entityIRI}`;
        const existing = statements.get(key) ?? {};
        for (const w of batch) {
          existing[w.path] = [
            { ...w.statement, value: w.value } as StatementNode,
          ];
        }
        statements.set(key, existing);
      },
      loadStatements: async (typeName: string, entityIRI: string) => {
        return statements.get(`${typeName}::${entityIRI}`) ?? {};
      },
      subscribe: (listener: (event: EntityChangeEvent) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };

    const handle = subscribeCalcInvalidation({
      store: store as never,
      profile,
      domainSchema: gardenFeeSchema,
      rootTypeName: "Garden",
      host: SERVER_CALC_HOST,
    });

    try {
      for (const listener of listeners) {
        listener({
          entityIRI: GARDEN_IRI,
          changeType: "upsert",
          typeIRI: "https://example.org/Garden",
          typeName: "Garden",
        });
      }
      await new Promise((r) => setTimeout(r, 0));

      const plotStmts = statements.get(`Plot::${PLOT_IRI}`);
      expect(plotStmts?.billable_area?.[0]?.value).toBe(
        gardenFeeExpected.plotBillable[0],
      );
      expect(
        plotStmts?.billable_area?.[0]?.wasGeneratedBy?.inputFingerprint,
      ).toBeTruthy();
    } finally {
      handle.unsubscribe();
    }
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
