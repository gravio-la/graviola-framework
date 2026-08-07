/**
 * Calc-tier warm contract: `warm()` and `subscribeCalcInvalidation()`
 * (`@graviola/calc-engine`) against a real store — not the in-memory
 * `WarmStore` fakes used by calc-engine's own unit tests. Runs only when an
 * adapter exposes a `calcWarmStore` (garden-fee schema + `statementMeta`
 * enabled, see `gardenFeeTestConfig.ts`).
 */
import { describe, test, expect } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import {
  createSparqlAffectedPlanner,
  subscribeCalcInvalidation,
  warm,
} from "@graviola/calc-engine";
import type { DatastoreContractStoreWithCalcWarm } from "../types";

const GARDEN_IRI = "https://example.org/garden/1";

async function seedGarden(
  store: DatastoreContractStoreWithCalcWarm,
): Promise<Record<string, any>> {
  const garden = structuredClone(gardenFeeSampleData) as Record<string, any>;
  const patch = garden.patch as Record<string, any>;
  for (const plot of patch.plots as Array<Record<string, any>>) {
    await store.upsert("Plot", plot["@id"], plot);
  }
  await store.upsert("Patch", patch["@id"], patch);
  await store.upsert("Garden", GARDEN_IRI, garden);
  return garden;
}

async function waitUntil(
  predicate: () => Promise<boolean>,
  { timeoutMs = 4000, intervalMs = 25 } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitUntil timed out after ${timeoutMs}ms`);
}

export function runCalcWarmSuite(
  getCalcWarmStore: () => DatastoreContractStoreWithCalcWarm,
): void {
  describe("Calc warm (real store, garden-fee)", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

    test("warm() writes fingerprinted statements matching gardenFeeExpected", async () => {
      const store = getCalcWarmStore();
      await seedGarden(store);

      const result = await warm(store, profile, "Garden", gardenFeeSchema, {
        rootIRIs: [GARDEN_IRI],
        agent: "https://example.org/agents/test",
      });

      expect(result.writesIssued).toBeGreaterThan(0);
      expect(result.warmed).toBeGreaterThan(0);

      const stmts = await store.loadStatements("Garden", GARDEN_IRI, [
        "annual_fee",
        "total_billable",
      ]);
      expect(stmts.annual_fee?.[0]?.value).toBe(
        gardenFeeExpected.gardenAnnualFee,
      );
      expect(stmts.total_billable?.[0]?.value).toBe(
        gardenFeeExpected.gardenTotalBillable,
      );
      expect(
        stmts.annual_fee?.[0]?.wasGeneratedBy?.inputFingerprint,
      ).toBeTruthy();
      expect(stmts.annual_fee?.[0]?.wasGeneratedBy?.agent).toBe(
        "https://example.org/agents/test",
      );
    });

    test("re-warm with skipFresh issues zero writes", async () => {
      const store = getCalcWarmStore();
      await seedGarden(store);

      const first = await warm(store, profile, "Garden", gardenFeeSchema, {
        rootIRIs: [GARDEN_IRI],
      });
      expect(first.writesIssued).toBeGreaterThan(0);

      const second = await warm(store, profile, "Garden", gardenFeeSchema, {
        rootIRIs: [GARDEN_IRI],
        skipFresh: true,
      });
      expect(second.writesIssued).toBe(0);
      expect(second.skippedFresh).toBe(first.warmed);
    });

    test("upsert-driven invalidation re-warms the affected root (coarse dirtying)", async () => {
      const store = getCalcWarmStore();
      await seedGarden(store);

      await warm(store, profile, "Garden", gardenFeeSchema, {
        rootIRIs: [GARDEN_IRI],
      });
      const before = await store.loadStatements("Garden", GARDEN_IRI, [
        "annual_fee",
      ]);
      const beforeFingerprint =
        before.annual_fee?.[0]?.wasGeneratedBy?.inputFingerprint;
      expect(beforeFingerprint).toBeTruthy();

      const errors: unknown[] = [];
      const handle = subscribeCalcInvalidation({
        store,
        profile,
        domainSchema: gardenFeeSchema,
        rootTypeName: "Garden",
        affectedPlanner: createSparqlAffectedPlanner(store),
        onError: (error) => errors.push(error),
      });

      try {
        const garden = gardenFeeSampleData as unknown as Record<string, any>;
        const plot = (garden.patch as Record<string, any>).plots[0] as Record<
          string,
          any
        >;
        // Double a Plot's width — Garden.annual_fee is downstream via
        // Patch.billable_area_total → Garden.total_billable → annual_fee.
        await store.upsert("Plot", plot["@id"], {
          ...plot,
          width_m: (plot.width_m as number) * 2,
        });

        await waitUntil(async () => {
          const after = await store.loadStatements("Garden", GARDEN_IRI, [
            "annual_fee",
          ]);
          const fp = after.annual_fee?.[0]?.wasGeneratedBy?.inputFingerprint;
          return Boolean(fp) && fp !== beforeFingerprint;
        });

        const after = await store.loadStatements("Garden", GARDEN_IRI, [
          "annual_fee",
        ]);
        expect(after.annual_fee?.[0]?.value).not.toBe(
          gardenFeeExpected.gardenAnnualFee,
        );
        expect(errors).toEqual([]);
      } finally {
        handle.unsubscribe();
      }
    });
  });
}
