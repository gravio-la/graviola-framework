import { describe, expect, it } from "bun:test";
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
import type { Calc, CapabilityDescriptor } from "@graviola/store-core";
import { createOxigraphStore } from "./createOxigraphStore.js";

const GARDEN_IRI = "https://example.org/garden/1";
const GARDEN_FEE_BASE_IRI = "https://example.org/";
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

type CalcWarmStore = Calc & {
  upsert: (
    typeName: string,
    entityIRI: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  capabilities: CapabilityDescriptor;
  loadStatements: (
    typeName: string,
    entityIRI: string,
    paths?: string[],
  ) => Promise<Record<string, { value: unknown }[]>>;
};

describe("attachCalcWarm", () => {
  it("materializes eval:server slots in Bun via SERVER_CALC_HOST default", async () => {
    const baseProfile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
    const profile = withSlotOverrides(baseProfile, {
      [PLOT_SERVER_SCOPE]: { eval: "server" },
    });

    const { store: rawStore } = await createOxigraphStore({
      schema: gardenFeeSchema,
      defaultPrefix: GARDEN_FEE_BASE_IRI,
      jsonldContext: { "@vocab": GARDEN_FEE_BASE_IRI },
      typeNameToTypeIRI: (typeName) => `${GARDEN_FEE_BASE_IRI}${typeName}`,
      queryBuildOptions: {
        propertyToIRI: (property) => `${GARDEN_FEE_BASE_IRI}${property}`,
        typeIRItoTypeName: (iri) => iri.replace(GARDEN_FEE_BASE_IRI, ""),
        primaryFields: { Garden: { label: "name" } },
        primaryFieldExtracts: {},
      },
      statementMeta: { policies: gardenFeeStatementPolicies },
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
    const store = rawStore as unknown as CalcWarmStore;

    const garden = structuredClone(gardenFeeSampleData) as Record<
      string,
      unknown
    >;
    const patch = garden.patch as Record<string, unknown>;
    for (const plot of patch.plots as Array<Record<string, unknown>>) {
      await store.upsert("Plot", plot["@id"] as string, plot);
    }
    await store.upsert("Patch", patch["@id"] as string, patch);
    await store.upsert("Garden", GARDEN_IRI, garden);

    expect(store.capabilities.calc).toBe(true);
    expect(store.capabilities.profiles?.calc).toEqual({
      rootTypes: ["Garden"],
      profileFingerprints: {
        Garden: profile.schemaIdentity.fingerprint,
      },
    });
    await expect(store.calcWarm("Plot")).rejects.toThrow(
      'Type "Plot" has no calc binding',
    );

    await store.calcWarm("Garden", { rootIRIs: [GARDEN_IRI] });

    const plotId = "https://example.org/plot/1";
    const stmts = await store.loadStatements("Plot", plotId, ["billable_area"]);
    expect(stmts.billable_area?.[0]?.value).toBe(
      gardenFeeExpected.plotBillable[0],
    );

    const [values] = await store.readCalcValues("Garden", [GARDEN_IRI]);
    expect(values?.entityIRI).toBe(GARDEN_IRI);
    expect(values).not.toHaveProperty("queriesIssued");
    expect(values).not.toHaveProperty("plan");
  });
});
