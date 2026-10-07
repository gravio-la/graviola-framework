import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { createStoreFromSpec } from "./index.js";

const PREFIX = "https://example.org/inventory/";

/**
 * Shape of `extendStatementSchema(base, extension)` from
 * `@graviola/statement-meta`, inlined because this package has no hard
 * dependency on it.
 */
const extendedStatementSchema: JSONSchema7 = {
  allOf: [
    {
      type: "object",
      properties: {
        value: { type: ["string", "number", "boolean"] },
        source: { type: "string", description: "dct:source" },
        generatedAt: { type: "string", format: "date-time" },
      },
    },
    {
      type: "object",
      properties: {
        capture: { type: "string" },
        quote: { type: "string" },
      },
    },
  ],
};

const schema: JSONSchema7 = {
  $id: `${PREFIX}schema`,
  definitions: {
    Device: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: `${PREFIX}Device` },
        name: { type: "string" },
        weight: { type: "string" },
      },
    },
  },
};

type StatementsStore = {
  upsert: (type: string, iri: string, doc: unknown) => Promise<unknown>;
  writeStatements: (
    type: string,
    iri: string,
    writes: Array<{
      path: string;
      value: string;
      statement: Record<string, unknown>;
    }>,
  ) => Promise<void>;
  loadStatements: (
    type: string,
    iri: string,
    paths?: string[],
  ) => Promise<Record<string, Array<Record<string, unknown>>>>;
  loadOne: (
    type: string,
    iri: string,
  ) => Promise<Record<string, unknown> | null>;
};

async function deviceStore(statementSchema?: JSONSchema7) {
  const { store } = await createStoreFromSpec({
    schema,
    defaultPrefix: PREFIX,
    statementMeta: {
      policies: { "Device.weight": "always" },
      ...(statementSchema ? { statementSchema } : {}),
    },
    backend: { kind: "oxigraph" },
  });
  return store as unknown as StatementsStore;
}

const IRI = `${PREFIX}entity/prs-t2`;
const write = {
  path: "weight",
  value: "164 g",
  statement: {
    source: "https://example.org/specs",
    generatedAt: "2026-10-01T10:00:00.000Z",
    capture: "urn:uuid:01a0ec24-6fa0-7000-8000-000000000000",
    quote: "Gewicht: 164 g",
  },
};

describe("statementMeta.statementSchema", () => {
  test("extension fields of a fact-level meta model round-trip", async () => {
    const store = await deviceStore(extendedStatementSchema);
    await store.upsert("Device", IRI, { "@id": IRI, name: "PRS-T2" });
    await store.writeStatements("Device", IRI, [write]);

    const { weight } = await store.loadStatements("Device", IRI, ["weight"]);
    expect(weight).toHaveLength(1);
    expect(weight![0]).toMatchObject({
      value: "164 g",
      source: "https://example.org/specs",
      capture: write.statement.capture,
      quote: "Gewicht: 164 g",
    });
    // Dual assertion: the truthy value is on the entity as well.
    expect((await store.loadOne("Device", IRI))?.weight).toBe("164 g");
  });

  test("a plain upsert keeps the stored statements of the entity", async () => {
    const store = await deviceStore(extendedStatementSchema);
    await store.upsert("Device", IRI, { "@id": IRI, name: "PRS-T2" });
    await store.writeStatements("Device", IRI, [write]);

    // What a form save does: load, change another field, upsert.
    const loaded = (await store.loadOne("Device", IRI))!;
    await store.upsert("Device", IRI, { ...loaded, name: "Sony PRS-T2" });

    const { weight } = await store.loadStatements("Device", IRI, ["weight"]);
    expect(weight).toHaveLength(1);
    expect(weight![0]).toMatchObject({
      value: "164 g",
      source: "https://example.org/specs",
      quote: "Gewicht: 164 g",
    });
    const after = (await store.loadOne("Device", IRI))!;
    expect(after.name).toBe("Sony PRS-T2");
    expect(after.weight).toBe("164 g");

    // A client cannot forge or replace statements through upsert.
    await store.upsert("Device", IRI, {
      ...after,
      weight$stmt: [{ value: "1 kg", source: "forged" }],
    });
    const again = await store.loadStatements("Device", IRI, ["weight"]);
    expect(again.weight!.map((s) => s.source)).toEqual([
      "https://example.org/specs",
    ]);
  });

  test("without the profile, extension fields are dropped and base fields stay", async () => {
    const store = await deviceStore();
    await store.upsert("Device", IRI, { "@id": IRI, name: "PRS-T2" });
    await store.writeStatements("Device", IRI, [write]);

    const { weight } = await store.loadStatements("Device", IRI, ["weight"]);
    expect(weight![0]).toMatchObject({
      value: "164 g",
      source: "https://example.org/specs",
    });
    expect(weight![0]!.quote).toBeUndefined();
  });
});
