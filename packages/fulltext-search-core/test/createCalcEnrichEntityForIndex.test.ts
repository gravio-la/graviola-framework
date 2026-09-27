import { describe, expect, test } from "bun:test";

import {
  createCalcEnrichEntitiesForIndex,
  createCalcEnrichEntityForIndex,
} from "../src/enrich/createCalcEnrichEntityForIndex";

describe("createCalcEnrichEntityForIndex", () => {
  const entity = {
    "@id": "http://ex.org/e/1",
    "@type": "http://ex.org/Exhibition",
    venue: "A",
  };

  test("enriches a calc root type and passes typeName to readCalcValues", async () => {
    let receivedTypeName: string | undefined;
    const store = {
      capabilities: {
        identifies: true as const,
        calc: true as const,
        profiles: { calc: { rootTypes: ["Exhibition"] } },
      },
      readCalcValues: async (typeName: string, entityIRIs: string[]) => {
        receivedTypeName = typeName;
        expect(entityIRIs).toEqual(["http://ex.org/e/1"]);
        return [
          {
            entityIRI: "http://ex.org/e/1",
            data: { title: "Computed Title" },
            provenance: {
              sources: ["mock"],
              fetchedAt: "2026-01-01T00:00:00.000Z",
              freshness: "fresh" as const,
            },
          },
        ];
      },
    };

    const enrich = createCalcEnrichEntityForIndex(store);
    const result = await enrich("Exhibition", entity);

    expect(receivedTypeName).toBe("Exhibition");
    expect(result).toEqual({ ...entity, title: "Computed Title" });
  });

  test("returns entity unchanged for a non-root type", async () => {
    const store = {
      capabilities: {
        identifies: true as const,
        calc: true as const,
        profiles: { calc: { rootTypes: ["Exhibition"] } },
      },
      readCalcValues: async () => {
        throw new Error("readCalcValues should not be called");
      },
    };

    const enrich = createCalcEnrichEntityForIndex(store);
    const result = await enrich("City", entity);

    expect(result).toBe(entity);
  });

  test("returns entity unchanged when readCalcValues throws", async () => {
    const store = {
      capabilities: {
        identifies: true as const,
        calc: true as const,
        profiles: { calc: { rootTypes: ["Exhibition"] } },
      },
      readCalcValues: async () => {
        throw new Error("calc unavailable");
      },
    };

    const enrich = createCalcEnrichEntityForIndex(store);
    const result = await enrich("Exhibition", entity);

    expect(result).toBe(entity);
  });
});

describe("createCalcEnrichEntitiesForIndex", () => {
  test("batch-enriches calc root types in one readCalcValues call", async () => {
    const entities = [
      { "@id": "http://ex.org/e/1", label: "One" },
      { "@id": "http://ex.org/e/2", label: "Two" },
    ];
    let receivedIris: string[] | undefined;
    const store = {
      capabilities: {
        identifies: true as const,
        calc: true as const,
        profiles: { calc: { rootTypes: ["Exhibition"] } },
      },
      readCalcValues: async (_typeName: string, entityIRIs: string[]) => {
        receivedIris = entityIRIs;
        return entityIRIs.map((entityIRI) => ({
          entityIRI,
          data: { title: `Title for ${entityIRI}` },
          provenance: {
            sources: ["mock"],
            fetchedAt: "2026-01-01T00:00:00.000Z",
            freshness: "fresh" as const,
          },
        }));
      },
    };

    const enrichMany = createCalcEnrichEntitiesForIndex(store);
    const result = await enrichMany("Exhibition", entities);

    expect(receivedIris).toEqual(["http://ex.org/e/1", "http://ex.org/e/2"]);
    expect(result[0]?.title).toBe("Title for http://ex.org/e/1");
    expect(result[1]?.title).toBe("Title for http://ex.org/e/2");
  });
});
