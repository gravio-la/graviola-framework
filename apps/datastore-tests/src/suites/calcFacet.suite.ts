/**
 * Typed `Calc<R>` facet contract against stores built through
 * `@graviola/store-factory` (not adapter `initSPARQLDatastorePair` variants).
 * Always uses in-process Oxigraph (`backend: { kind: "oxigraph" }`), so it is
 * registered once outside the adapter loop in `datastore.test.ts`.
 */
import { describe, test, expect } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
  gardenFeeStatementPolicies,
} from "@graviola/calc-fixtures";
import {
  compileCalcProfile,
  type CompiledProfile,
  type CompiledSlot,
} from "@graviola/formula-dependency";
import { createStoreFromSpec } from "@graviola/store-factory";
import type { BaseStore, Calc } from "@graviola/store-core";
import { hasCapability } from "@graviola/store-core";
import {
  GARDEN_FEE_BASE_IRI,
  gardenFeeQueryBuildOptions,
} from "../schema/gardenFeeTestConfig";

const GARDEN_A = "https://example.org/garden/1";
const GARDEN_B = "https://example.org/garden/2";
const GARDEN_MISSING = "https://example.org/garden/missing";
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

type CalcFacetStore = BaseStore &
  Calc & {
    upsert: (
      typeName: string,
      entityIRI: string,
      data: Record<string, unknown>,
    ) => Promise<void>;
    loadStatements: (
      typeName: string,
      entityIRI: string,
      paths?: string[],
    ) => Promise<Record<string, { value: unknown }[]>>;
  };

async function createCalcFacetStore(options?: {
  serverSlot?: boolean;
}): Promise<{ store: CalcFacetStore; profile: CompiledProfile }> {
  const baseProfile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
  const profile = options?.serverSlot
    ? withSlotOverrides(baseProfile, {
        [PLOT_SERVER_SCOPE]: { eval: "server" },
      })
    : baseProfile;

  const { store: rawStore } = await createStoreFromSpec({
    schema: gardenFeeSchema,
    defaultPrefix: GARDEN_FEE_BASE_IRI,
    jsonldContext: { "@vocab": GARDEN_FEE_BASE_IRI },
    typeNameToTypeIRI: (typeName) => `${GARDEN_FEE_BASE_IRI}${typeName}`,
    queryBuildOptions: gardenFeeQueryBuildOptions,
    statementMeta: {
      policies: gardenFeeStatementPolicies,
      encoding: "statement-node",
    },
    calc: {
      bindings: [
        {
          profile,
          domainSchema: gardenFeeSchema,
          rootTypeName: "Garden",
        },
      ],
    },
    backend: { kind: "oxigraph" },
  });

  return { store: rawStore as unknown as CalcFacetStore, profile };
}

async function seedGardenEntity(
  store: CalcFacetStore,
  gardenIri: string,
  name: string,
): Promise<void> {
  const suffix = gardenIri.replace(/.*\//, "");
  const garden = structuredClone(gardenFeeSampleData) as Record<
    string,
    unknown
  >;
  garden["@id"] = gardenIri;
  garden.name = name;
  const patch = garden.patch as Record<string, unknown>;
  patch["@id"] = `https://example.org/patch/${suffix}`;
  const plots = patch.plots as Array<Record<string, unknown>>;
  plots.forEach((plot, index) => {
    plot["@id"] = `https://example.org/plot/${suffix}-${index + 1}`;
  });
  for (const plot of plots) {
    await store.upsert("Plot", plot["@id"] as string, plot);
  }
  await store.upsert("Patch", patch["@id"] as string, patch);
  await store.upsert("Garden", gardenIri, garden);
}

export function runCalcFacetSuite(): void {
  describe("Calc facet (store-factory, garden-fee)", () => {
    test("hasCapability(calc) and profiles.calc.rootTypes", async () => {
      const { store, profile } = await createCalcFacetStore();

      expect(hasCapability(store, "calc")).toBe(true);
      expect(store.capabilities.profiles?.calc?.rootTypes).toContain("Garden");
      expect(store.capabilities.profiles?.calc?.profileFingerprints).toEqual({
        Garden: profile.schemaIdentity.fingerprint,
      });
    });

    test("calcWarm warms all roots; skipFresh skips on second call", async () => {
      const { store } = await createCalcFacetStore();
      await seedGardenEntity(store, GARDEN_A, "Allotment North");
      await seedGardenEntity(store, GARDEN_B, "Allotment South");

      const first = await store.calcWarm("Garden");
      expect(first.writesIssued).toBeGreaterThan(0);
      expect(first.warmed).toBeGreaterThan(0);

      for (const iri of [GARDEN_A, GARDEN_B]) {
        const stmts = await store.loadStatements("Garden", iri, ["annual_fee"]);
        expect(stmts.annual_fee?.[0]?.value).toBe(
          gardenFeeExpected.gardenAnnualFee,
        );
      }

      const second = await store.calcWarm("Garden", { skipFresh: true });
      expect(second.writesIssued).toBe(0);
      expect(second.skippedFresh).toBe(first.warmed);
    });

    test("readCalcValues returns ordered entries with fresh values and null for missing", async () => {
      const { store } = await createCalcFacetStore();
      await seedGardenEntity(store, GARDEN_A, "Allotment North");
      await seedGardenEntity(store, GARDEN_B, "Allotment South");

      await store.calcWarm("Garden", { rootIRIs: [GARDEN_A, GARDEN_B] });

      const entries = await store.readCalcValues("Garden", [
        GARDEN_A,
        GARDEN_B,
        GARDEN_MISSING,
      ]);

      expect(entries).toHaveLength(3);
      expect(entries.map((entry) => entry.entityIRI)).toEqual([
        GARDEN_A,
        GARDEN_B,
        GARDEN_MISSING,
      ]);
      expect(entries[0]?.data?.annual_fee).toBe(
        gardenFeeExpected.gardenAnnualFee,
      );
      expect(entries[0]?.provenance.freshness).toBe("fresh");
      expect(entries[1]?.data?.annual_fee).toBe(
        gardenFeeExpected.gardenAnnualFee,
      );
      expect(entries[1]?.provenance.freshness).toBe("fresh");
      expect(entries[2]?.data).toBeNull();
    });

    test('calcWarm("NotARoot") rejects', async () => {
      const { store } = await createCalcFacetStore();
      await expect(store.calcWarm("NotARoot")).rejects.toThrow(
        'Type "NotARoot" has no calc binding',
      );
    });

    test('materializes eval: "server" slots via SERVER_CALC_HOST default', async () => {
      const { store } = await createCalcFacetStore({ serverSlot: true });
      await seedGardenEntity(store, GARDEN_A, "Allotment North");
      await store.calcWarm("Garden", { rootIRIs: [GARDEN_A] });

      const plotId = "https://example.org/plot/1-1";
      const stmts = await store.loadStatements("Plot", plotId, [
        "billable_area",
      ]);
      expect(stmts.billable_area?.[0]?.value).toBe(
        gardenFeeExpected.plotBillable[0],
      );
    });
  });
}
