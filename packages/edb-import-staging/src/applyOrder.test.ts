import { describe, expect, test } from "bun:test";
import { referenceFirstApplyOrder } from "./applyOrder";
import { prepareStagedDocument } from "./prepareStagedDocument";
import type { StagedEntity } from "./types";

const baseEntity = (
  entityIRI: string,
  document: Record<string, unknown>,
  depth = 0,
): StagedEntity => ({
  entityIRI,
  typeIRI: "http://example.org/Entity",
  document,
  provenance: { method: "manual", timestamp: new Date().toISOString() },
  trace: { mappingPath: [], decision: "created" },
  depth,
  reviewState: "pending",
});

describe("referenceFirstApplyOrder", () => {
  test("applies referenced entities before referencers", () => {
    const parentIRI = "http://example.org/parent";
    const childIRI = "http://example.org/child";
    const ordered = referenceFirstApplyOrder([
      baseEntity(
        childIRI,
        {
          "@id": childIRI,
          parent: { "@id": parentIRI },
        },
        2,
      ),
      baseEntity(parentIRI, { "@id": parentIRI }, 1),
    ]);

    expect(ordered.map((entity) => entity.entityIRI)).toEqual([
      parentIRI,
      childIRI,
    ]);
  });
});

describe("prepareStagedDocument", () => {
  test("unwraps single-element parent arrays and strips mapping metadata", () => {
    const normalized = prepareStagedDocument({
      "@id": "http://example.org/entity",
      parent: [{ "@id": "http://example.org/parent" }],
      idAuthority: { authority: "http://www.wikidata.org", id: "Q1" },
      titleVariants: "x".repeat(700),
    });

    expect(normalized.parent).toEqual({
      "@id": "http://example.org/parent",
    });
    expect(normalized.idAuthority).toBeUndefined();
    expect(normalized.sameAs).toBe("Q1");
    expect((normalized.titleVariants as string).length).toBe(600);
  });

  test("promotes idAuthority.id to sameAs and collapses nested entity bodies", () => {
    const normalized = prepareStagedDocument({
      "@id": "http://example.org/city",
      partOf: {
        "@id": "http://example.org/place",
        name: "Landkreis",
        idAuthority: { authority: "http://www.wikidata.org", id: "Q9" },
      },
      idAuthority: {
        authority: "http://www.wikidata.org",
        id: "http://www.wikidata.org/entity/Q42",
      },
    });

    expect(normalized.sameAs).toBe("http://www.wikidata.org/entity/Q42");
    expect(normalized.idAuthority).toBeUndefined();
    expect(normalized.partOf).toEqual({ "@id": "http://example.org/place" });
  });
});
