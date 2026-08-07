import { describe, expect, it } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import type { StatementNode } from "@graviola/provenance-types";
import { readCalcValues, type ReadCalcValuesStore } from "./readCalcValues";
import { warm } from "./warm";
import { evaluateForRoots } from "./evaluateForRoots";

const GARDEN_IRI = "https://example.org/garden/1";

type WarmableStore = ReadCalcValuesStore & {
  writeStatements: (
    typeName: string,
    entityIRI: string,
    batch: { path: string; value: unknown; statement: StatementNode }[],
  ) => Promise<void>;
};

/**
 * A statements map shared across two store *views* of the same underlying
 * data — one used to `warm()` against the original fixture, another used to
 * `readCalcValues()` against a mutated fixture — so staleness can be
 * exercised without a real store (mirrors `evaluateForRoots.test.ts`'s
 * `warm` fake).
 */
function makeStatementsMap(): Map<string, Record<string, StatementNode[]>> {
  return new Map();
}

function makeStoreView(
  statements: Map<string, Record<string, StatementNode[]>>,
  buildDoc: () => Record<string, unknown>,
): WarmableStore {
  return {
    filterMany: async () => [buildDoc()],
    loadStatements: async (typeName: string, entityIRI: string) =>
      statements.get(`${typeName}::${entityIRI}`) ?? {},
    writeStatements: async (typeName, entityIRI, batch) => {
      const key = `${typeName}::${entityIRI}`;
      const existing = statements.get(key) ?? {};
      for (const w of batch) {
        existing[w.path] = [
          { ...w.statement, value: w.value } as StatementNode,
        ];
      }
      statements.set(key, existing);
    },
  };
}

/**
 * A real post-`warm()` store persists intermediate computed properties
 * (e.g. `Patch.billable_area_total`) as plain fields at every level — dual
 * assertion (Stage D), not just at the root. `readCalcValues`'s fresh path
 * relies on `filterMany` returning those already-persisted values (it never
 * evaluates on the fresh path), so a faithful fake must return the
 * *evaluated* tree, not the bare raw fixture.
 */
async function evaluatedDoc(
  profile: ReturnType<typeof compileCalcProfile>,
): Promise<Record<string, unknown>> {
  const bareStore = {
    filterMany: async () => [
      structuredClone(gardenFeeSampleData) as Record<string, unknown>,
    ],
  };
  const evaluated = await evaluateForRoots(
    bareStore,
    profile,
    "Garden",
    gardenFeeSchema,
    { rootIRIs: [GARDEN_IRI] },
  );
  return evaluated.values[0] as Record<string, unknown>;
}

const originalDoc = (): Record<string, unknown> =>
  structuredClone(gardenFeeSampleData) as Record<string, unknown>;

const mutatedDoc = (
  doc: Record<string, unknown>,
  multiplier: number,
): Record<string, unknown> => {
  const cloned = structuredClone(doc);
  const plots = (cloned.patch as Record<string, unknown>).plots as Record<
    string,
    unknown
  >[];
  plots[0]!.width_m = (plots[0]!.width_m as number) * multiplier;
  return cloned;
};

describe("readCalcValues", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("fresh: splices materialized values from loadStatements, no evaluation", async () => {
    const statements = makeStatementsMap();
    const doc = await evaluatedDoc(profile);
    const store = makeStoreView(statements, () => structuredClone(doc));
    await warm(store as never, profile, "Garden", gardenFeeSchema, {
      rootIRIs: [GARDEN_IRI],
    });

    const result = await readCalcValues(
      store,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );

    expect(result.freshness).toBe("fresh");
    expect(result.value?.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
    expect(result.value?.total_billable).toBe(
      gardenFeeExpected.gardenTotalBillable,
    );
    // 1 filterMany + 4 loadStatements (Garden, Patch, Plot x2).
    expect(result.queriesIssued).toBe(5);
  });

  it("stale: source changed since warm, recomputes without writing through", async () => {
    const statements = makeStatementsMap();
    const doc = await evaluatedDoc(profile);
    const warmStore = makeStoreView(statements, () => structuredClone(doc));
    await warm(warmStore as never, profile, "Garden", gardenFeeSchema, {
      rootIRIs: [GARDEN_IRI],
    });

    // Same persisted statements, but the store now reports mutated data
    // (simulates an edit landing after `warm()` without a re-warm).
    const staleStore = makeStoreView(statements, () => mutatedDoc(doc, 2));

    const result = await readCalcValues(
      staleStore,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );

    expect(result.freshness).toBe("stale");
    expect(result.value?.annual_fee).not.toBe(
      gardenFeeExpected.gardenAnnualFee,
    );

    // No write-through: the persisted statement is still the pre-mutation value.
    const persisted = statements.get(`Garden::${GARDEN_IRI}`);
    expect(persisted?.annual_fee?.[0]?.value).toBe(
      gardenFeeExpected.gardenAnnualFee,
    );
  });

  it("unknown: never warmed, still computes correctly via fallback", async () => {
    const statements = makeStatementsMap();
    const store = makeStoreView(statements, originalDoc);

    const result = await readCalcValues(
      store,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );

    expect(result.freshness).toBe("unknown");
    expect(result.value?.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
  });

  it("missing root: returns null", async () => {
    const store: ReadCalcValuesStore = {
      filterMany: async () => [],
      loadStatements: async () => ({}),
    };

    const result = await readCalcValues(
      store,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );

    expect(result.value).toBeNull();
    expect(result.freshness).toBe("unknown");
  });
});
