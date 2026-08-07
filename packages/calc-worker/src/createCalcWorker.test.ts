import { describe, expect, it } from "bun:test";
import {
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import type { StatementNode } from "@graviola/provenance-types";
import type { EntityChangeEvent } from "@graviola/store-core";
import { createCalcWorker } from "./createCalcWorker";

const GARDEN_IRI = "https://example.org/garden/1";

function makeFakeStore() {
  const statements = new Map<string, Record<string, StatementNode[]>>();
  const listeners = new Set<(event: EntityChangeEvent) => void>();
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
      for (const w of batch) existing[w.path] = [w.statement];
      statements.set(key, existing);
    },
    loadStatements: async (typeName: string, entityIRI: string) => {
      return statements.get(`${typeName}::${entityIRI}`) ?? {};
    },
    subscribe: (listener: (event: EntityChangeEvent) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit: (event: EntityChangeEvent) => {
      for (const l of listeners) l(event);
    },
  };

  return { store, statements, getWrites: () => writes };
}

describe("createCalcWorker", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("warms on start and materializes Garden.annual_fee", async () => {
    const { store, statements } = makeFakeStore();

    const worker = await createCalcWorker({
      store,
      profile,
      domainSchema: gardenFeeSchema,
      rootTypeName: "Garden",
    });

    const gardenStmts = statements.get(`Garden::${GARDEN_IRI}`);
    expect(
      gardenStmts?.annual_fee?.[0]?.wasGeneratedBy?.inputFingerprint,
    ).toBeTruthy();

    worker.stop();
  });

  it("re-warms on an upsert change event while subscribed", async () => {
    const { store, getWrites } = makeFakeStore();

    const worker = await createCalcWorker({
      store,
      profile,
      domainSchema: gardenFeeSchema,
      rootTypeName: "Garden",
      warmOnStart: false,
    });

    expect(getWrites()).toBe(0);

    store.emit({
      entityIRI: GARDEN_IRI,
      changeType: "upsert",
      typeIRI: "https://example.org/Garden",
      typeName: "Garden",
    });
    // subscribeCalcInvalidation's listener is async and fire-and-forget;
    // give the microtask queue a turn to flush the warm() call.
    await new Promise((r) => setTimeout(r, 0));

    expect(getWrites()).toBeGreaterThan(0);

    worker.stop();
  });

  it("warmNow performs an on-demand full sweep", async () => {
    const { store, getWrites } = makeFakeStore();

    const worker = await createCalcWorker({
      store,
      profile,
      domainSchema: gardenFeeSchema,
      rootTypeName: "Garden",
      warmOnStart: false,
    });

    expect(getWrites()).toBe(0);
    const result = await worker.warmNow();
    expect(result.writesIssued).toBeGreaterThan(0);
    expect(getWrites()).toBe(result.writesIssued);

    worker.stop();
  });
});
