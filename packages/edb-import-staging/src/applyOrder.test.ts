import { describe, expect, test } from "bun:test";
import { referenceFirstApplyOrder } from "./applyOrder";
import { normalizeStagedDocument } from "./normalizeStagedDocument";
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

describe("normalizeStagedDocument", () => {
  test("unwraps single-element parent arrays and strips mapping metadata", () => {
    const normalized = normalizeStagedDocument({
      "@id": "http://example.org/entity",
      parent: [{ "@id": "http://example.org/parent" }],
      idAuthority: { authority: "http://www.wikidata.org", id: "Q1" },
      titleVariants: "x".repeat(700),
    });

    expect(normalized.parent).toEqual({
      "@id": "http://example.org/parent",
    });
    expect(normalized.idAuthority).toBeUndefined();
    expect((normalized.titleVariants as string).length).toBe(600);
  });
});
