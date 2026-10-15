import { describe, expect, test } from "bun:test";

import {
  buildLinkedReferenceObject,
  resolveLinkedReferenceLabel,
  resolveLinkedReferenceLabelKey,
} from "./linkedReferenceLabel";

describe("linkedReferenceLabel", () => {
  test("uses primaryFields label key when declared", () => {
    expect(
      resolveLinkedReferenceLabelKey("Person", {
        Person: { label: "lastName" },
      }),
    ).toBe("lastName");
  });

  test("defaults label key to name (findEntityByClass parity)", () => {
    expect(resolveLinkedReferenceLabelKey("Einheit", {})).toBe("name");
  });

  test("reads name when Einheit has no primaryFields entry", () => {
    expect(
      resolveLinkedReferenceLabel({
        data: { "@id": "x", name: "g", abkuerzung: "g" },
        typeName: "Einheit",
        primaryFields: {},
      }),
    ).toBe("g");
  });

  test("prefers declared key then fallbacks", () => {
    expect(
      resolveLinkedReferenceLabel({
        data: { title: "T", name: "N" },
        typeName: "X",
        primaryFields: { X: { label: "title" } },
      }),
    ).toBe("T");
  });

  test("buildLinkedReferenceObject writes name for Einheit", () => {
    expect(
      buildLinkedReferenceObject({
        entityIRI: "26324800-1385-43ae-9b2d-111111111111",
        typeIRI: "https://example.org/Einheit",
        typeName: "Einheit",
        primaryFields: {},
        entityData: { name: "ml" },
      }),
    ).toEqual({
      "@id": "26324800-1385-43ae-9b2d-111111111111",
      "@type": "https://example.org/Einheit",
      name: "ml",
    });
  });

  test("uses suggestion label when entity data has no display fields", () => {
    expect(
      buildLinkedReferenceObject({
        entityIRI: "http://example.org/z/1",
        typeIRI: "http://example.org/Zutat",
        typeName: "Zutat",
        primaryFields: { Zutat: { label: "name" } },
        suggestionLabel: "Zucker",
      }).name,
    ).toBe("Zucker");
  });
});
