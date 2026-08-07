/**
 * Materialized-first read contract: `readCalcValues()` (`@graviola/calc-engine`)
 * against a real store — not the in-memory fakes used by calc-engine's own
 * unit tests. Runs only when an adapter exposes a `calcWarmStore` (same
 * fixture as `calcWarm.suite.ts`).
 *
 * Design note (verified empirically, not assumed): `$stmt` sidecars are only
 * auto-embedded on an *unfiltered* read — `evaluateForRoots`'s own
 * `planCalcReads` selection is source-only (built to feed the evaluator, so
 * it never requests materialized outputs), and nested entities reached via
 * `include` don't reliably carry `$stmt` either (empty/duplicated sidecars —
 * see ESCALATIONS.md). So `readCalcValues` does not try to get statements
 * "for free" from one combined read; it fetches the raw input tree once,
 * then calls the already-proven-reliable `store.loadStatements` per entity.
 * The first test below proves the piece that read-shape *does* still
 * assume: that `planCalcReads`'s source-only selection correctly returns
 * intermediate materialized values (e.g. `Patch.billable_area_total`) that
 * feed higher-stratum fingerprints, since Stage D dual-asserts every level.
 */
import { describe, test, expect } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import { planCalcReads } from "@graviola/formula-dependency";
import { readCalcValues, warm } from "@graviola/calc-engine";
import type { DatastoreContractStoreWithCalcWarm } from "../types";

const GARDEN_IRI = "https://example.org/garden/1";

async function seedGarden(
  store: DatastoreContractStoreWithCalcWarm,
): Promise<void> {
  const garden = structuredClone(gardenFeeSampleData) as Record<string, any>;
  const patch = garden.patch as Record<string, any>;
  for (const plot of patch.plots as Array<Record<string, any>>) {
    await store.upsert("Plot", plot["@id"], plot);
  }
  await store.upsert("Patch", patch["@id"], patch);
  await store.upsert("Garden", GARDEN_IRI, garden);
}

export function runReadCalcValuesSuite(
  getCalcWarmStore: () => DatastoreContractStoreWithCalcWarm,
): void {
  describe("readCalcValues (real store, garden-fee)", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

    test("read-shape conformance: source-only selection returns dual-asserted intermediate values", async () => {
      const store = getCalcWarmStore();
      await seedGarden(store);
      await warm(store, profile, "Garden", gardenFeeSchema, {
        rootIRIs: [GARDEN_IRI],
      });

      const plan = planCalcReads(profile, "Garden", gardenFeeSchema);
      const [doc] = await store.filterMany("Garden", {
        ...(plan.selection as object),
        entityIRIs: [GARDEN_IRI],
      } as never);
      const garden = doc as Record<string, any>;
      // Garden.total_billable's own formula reads patch.billable_area_total —
      // an intermediate *computed* value, not a raw leaf input. It must be
      // fetchable as a plain property (Stage D dual-asserts every level) for
      // readCalcValues's fingerprint comparison to ever agree with warm()'s.
      expect(garden.patch?.billable_area_total).toBe(
        gardenFeeExpected.patchTotal,
      );
      expect(garden.total_billable).toBe(gardenFeeExpected.gardenTotalBillable);
      // Confirmed separately (not asserted here): $stmt sidecars are NOT
      // part of this selection — readCalcValues fetches those via
      // `loadStatements` per entity instead, see suite doc comment above.
      expect(garden["total_billable$stmt"]).toBeUndefined();
    });

    test("fresh: no evaluation needed, value matches gardenFeeExpected", async () => {
      const store = getCalcWarmStore();
      await seedGarden(store);
      await warm(store, profile, "Garden", gardenFeeSchema, {
        rootIRIs: [GARDEN_IRI],
      });

      let filterCalls = 0;
      const countingStore = {
        filterMany: async (typeName: string, options?: unknown) => {
          filterCalls += 1;
          return store.filterMany(typeName, options as never);
        },
        loadStatements: (
          typeName: string,
          entityIRI: string,
          paths?: string[],
        ) => store.loadStatements(typeName, entityIRI, paths),
      };

      const result = await readCalcValues(
        countingStore,
        profile,
        "Garden",
        gardenFeeSchema,
        GARDEN_IRI,
      );

      expect(result.freshness).toBe("fresh");
      // One filterMany for the raw tree; no extra one from evaluation
      // (skipped entirely on the fresh path).
      expect(filterCalls).toBe(1);
      expect(result.value?.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
    });

    test("stale: source changed without a re-warm, recomputes live without writing through", async () => {
      const store = getCalcWarmStore();
      await seedGarden(store);
      await warm(store, profile, "Garden", gardenFeeSchema, {
        rootIRIs: [GARDEN_IRI],
      });

      // Mutate a Plot directly (no subscribeCalcInvalidation running) —
      // simulates calc-worker being behind or down.
      const garden = gardenFeeSampleData as unknown as Record<string, any>;
      const plot = (garden.patch as Record<string, any>).plots[0] as Record<
        string,
        any
      >;
      await store.upsert("Plot", plot["@id"], {
        ...plot,
        width_m: (plot.width_m as number) * 2,
      });

      const result = await readCalcValues(
        store,
        profile,
        "Garden",
        gardenFeeSchema,
        GARDEN_IRI,
      );

      expect(result.freshness).toBe("stale");
      expect(result.value?.annual_fee).not.toBe(
        gardenFeeExpected.gardenAnnualFee,
      );

      // No write-through: the persisted Garden.annual_fee is unchanged.
      const stmts = await store.loadStatements("Garden", GARDEN_IRI, [
        "annual_fee",
      ]);
      expect(stmts.annual_fee?.[0]?.value).toBe(
        gardenFeeExpected.gardenAnnualFee,
      );
    });

    test("unknown: never warmed, still computes correctly via fallback", async () => {
      const store = getCalcWarmStore();
      await seedGarden(store);

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
  });
}
