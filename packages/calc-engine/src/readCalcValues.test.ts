import { describe, expect, it } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import type { StatementNode } from "@graviola/provenance-types";
import {
  readCalcValues,
  readCalcValuesMany,
  type ReadCalcValuesStore,
} from "./readCalcValues";
import { warm } from "./warm";
import { evaluateForRoots } from "./evaluateForRoots";

const GARDEN_IRI = "https://example.org/garden/1";
const MISSING_IRI = "https://example.org/garden/missing";
const SIBLING_GARDEN_IRI = "https://example.org/garden/2";

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

function withInverseStubs(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  doc.contains = [
    { "@id": GARDEN_IRI, "@type": "Garden" },
    { "@id": SIBLING_GARDEN_IRI, "@type": "Garden" },
  ];
  return doc;
}

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

    expect(result.provenance.freshness).toBe("fresh");
    expect(result.data?.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
    expect(result.data?.total_billable).toBe(
      gardenFeeExpected.gardenTotalBillable,
    );
    // 1 filterMany + 4 loadStatements (Garden, Patch, Plot x2).
    expect(result.queriesIssued).toBe(5);
  });

  it("fresh: serves the latest statement when older history comes first", async () => {
    const statements = makeStatementsMap();
    const doc = await evaluatedDoc(profile);
    const store = makeStoreView(statements, () => structuredClone(doc));
    await warm(store as never, profile, "Garden", gardenFeeSchema, {
      rootIRIs: [GARDEN_IRI],
    });

    // Some backends return statement history oldest first.
    const gardenStatements = statements.get(`Garden::${GARDEN_IRI}`)!;
    const [current] = gardenStatements.annual_fee!;
    gardenStatements.annual_fee = [
      {
        ...current!,
        value: -1,
        generatedAt: "2000-01-01T00:00:00.000Z",
        wasGeneratedBy: {
          ...current!.wasGeneratedBy!,
          inputFingerprint: "outdated",
        },
      },
      current!,
    ];

    const result = await readCalcValues(
      store,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );

    expect(result.provenance.freshness).toBe("fresh");
    expect(result.data?.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
  });

  it("stays fresh when a deep load contains inverse relation stubs", async () => {
    const statements = makeStatementsMap();
    const doc = await evaluatedDoc(profile);
    const base = makeStoreView(statements, () => structuredClone(doc));
    const loadStatementCalls: string[] = [];
    const store: WarmableStore = {
      ...base,
      loadOne: async () => withInverseStubs(structuredClone(doc)),
      loadStatements: async (typeName, entityIRI, paths) => {
        loadStatementCalls.push(`${typeName}::${entityIRI}`);
        return base.loadStatements(typeName, entityIRI, paths);
      },
    };

    await warm(store as never, profile, "Garden", gardenFeeSchema, {
      rootIRIs: [GARDEN_IRI],
    });
    loadStatementCalls.length = 0;

    const result = await readCalcValues(
      store,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );

    expect(result.provenance.freshness).toBe("fresh");
    expect(result.data?.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
    expect(
      loadStatementCalls.filter((key) => key === `Garden::${GARDEN_IRI}`),
    ).toHaveLength(1);
    expect(loadStatementCalls).not.toContain(`Garden::${SIBLING_GARDEN_IRI}`);
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

    expect(result.provenance.freshness).toBe("stale");
    expect(result.data?.annual_fee).not.toBe(gardenFeeExpected.gardenAnnualFee);

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

    expect(result.provenance.freshness).toBe("unknown");
    expect(result.data?.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
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

    expect(result.data).toBeNull();
    expect(result.provenance.freshness).toBe("unknown");
  });
});

describe("readCalcValuesMany", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("returns one entry per requested IRI in order; absent roots have data null", async () => {
    const statements = makeStatementsMap();
    const doc = await evaluatedDoc(profile);
    const store = makeStoreView(statements, () => structuredClone(doc));
    await warm(store as never, profile, "Garden", gardenFeeSchema, {
      rootIRIs: [GARDEN_IRI],
    });

    const entityIRIs = [GARDEN_IRI, MISSING_IRI, GARDEN_IRI];
    const results = await readCalcValuesMany(
      store,
      profile,
      "Garden",
      gardenFeeSchema,
      entityIRIs,
    );

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.entityIRI)).toEqual(entityIRIs);
    expect(results[0]!.data?.annual_fee).toBe(
      gardenFeeExpected.gardenAnnualFee,
    );
    expect(results[1]!.data).toBeNull();
    expect(results[1]!.provenance.freshness).toBe("unknown");
    expect(results[2]!.data?.annual_fee).toBe(
      gardenFeeExpected.gardenAnnualFee,
    );
  });

  it("issues exactly one filterMany for the whole batch", async () => {
    const statements = makeStatementsMap();
    const doc = await evaluatedDoc(profile);
    let filterManyCalls = 0;
    const base = makeStoreView(statements, () => structuredClone(doc));
    const store: WarmableStore = {
      ...base,
      filterMany: async (typeName, options) => {
        filterManyCalls += 1;
        return base.filterMany(typeName, options);
      },
    };
    await warm(store as never, profile, "Garden", gardenFeeSchema, {
      rootIRIs: [GARDEN_IRI],
    });
    filterManyCalls = 0;

    await readCalcValuesMany(store, profile, "Garden", gardenFeeSchema, [
      GARDEN_IRI,
      MISSING_IRI,
      GARDEN_IRI,
    ]);

    expect(filterManyCalls).toBe(1);
  });

  it("fresh and stale entries match single-root readCalcValues values", async () => {
    const statements = makeStatementsMap();
    const doc = await evaluatedDoc(profile);
    const warmStore = makeStoreView(statements, () => structuredClone(doc));
    await warm(warmStore as never, profile, "Garden", gardenFeeSchema, {
      rootIRIs: [GARDEN_IRI],
    });

    const freshSingle = await readCalcValues(
      warmStore,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );
    const [freshBatch] = await readCalcValuesMany(
      warmStore,
      profile,
      "Garden",
      gardenFeeSchema,
      [GARDEN_IRI],
    );

    expect(freshBatch!.data).toEqual(freshSingle.data);
    expect(freshBatch!.provenance.freshness).toBe(
      freshSingle.provenance.freshness,
    );
    expect(freshBatch!.queriesIssued).toBe(freshSingle.queriesIssued);

    const staleStore = makeStoreView(statements, () => mutatedDoc(doc, 2));
    const staleSingle = await readCalcValues(
      staleStore,
      profile,
      "Garden",
      gardenFeeSchema,
      GARDEN_IRI,
    );
    const [staleBatch] = await readCalcValuesMany(
      staleStore,
      profile,
      "Garden",
      gardenFeeSchema,
      [GARDEN_IRI],
    );

    expect(staleBatch!.data).toEqual(staleSingle.data);
    expect(staleBatch!.provenance.freshness).toBe(
      staleSingle.provenance.freshness,
    );
    expect(staleBatch!.queriesIssued).toBe(staleSingle.queriesIssued);
  });
});
