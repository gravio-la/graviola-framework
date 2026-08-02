import { describe, expect, test } from "bun:test";
import type { StagedEntity } from "@graviola/edb-import-staging";
import { materializeContainsFromPartOf } from "./materializeContains";

const entity = (
  iri: string,
  typeIRI: string,
  document: Record<string, unknown>,
): StagedEntity => ({
  entityIRI: iri,
  typeIRI,
  document: { "@id": iri, "@type": typeIRI, ...document },
});

describe("materializeContainsFromPartOf", () => {
  test("writes forward contains from partOf among known entities", () => {
    const parent = entity("http://ex/Place/P1", "http://ex#Place", {
      name: "Parent",
    });
    const childA = entity("http://ex/City/C1", "http://ex#City", {
      name: "A",
      partOf: { "@id": "http://ex/Place/P1" },
    });
    const childB = entity("http://ex/City/C2", "http://ex#City", {
      name: "B",
      partOf: { "@id": "http://ex/Place/P1" },
    });
    const orphan = entity("http://ex/City/C3", "http://ex#City", {
      name: "Orphan",
      partOf: { "@id": "http://ex/Place/MISSING" },
    });

    const result = materializeContainsFromPartOf([
      parent,
      childB,
      childA,
      orphan,
    ]);
    const parentDoc = result.find(
      (e) => e.entityIRI === parent.entityIRI,
    )!.document;

    expect(parentDoc.contains).toEqual([
      { "@id": "http://ex/City/C1" },
      { "@id": "http://ex/City/C2" },
    ]);
    expect(
      result.find((e) => e.entityIRI === orphan.entityIRI)!.document.contains,
    ).toBeUndefined();
  });
});
