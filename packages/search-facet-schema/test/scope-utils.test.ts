import { describe, expect, test } from "bun:test";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";
import {
  listSearchableTypes,
  scopesForType,
  typeFromScope,
  propertyNameFromScope,
} from "../src/scope-utils";

describe("scope-utils", () => {
  const sidecar = loadSearchFacetSchema({
    fulltextIndex: {
      scopes: {
        "#/definitions/Exhibition/properties/title": {},
      },
      types: { Place: { searchable: true } },
    },
    facets: {
      scopes: {
        "#/definitions/Exhibition/properties/year": { facet: "range" },
      },
    },
  });

  test("typeFromScope / propertyNameFromScope", () => {
    const scope = "#/definitions/Exhibition/properties/title";
    expect(typeFromScope(scope)).toBe("Exhibition");
    expect(propertyNameFromScope(scope)).toBe("title");
  });

  test("listSearchableTypes", () => {
    expect(listSearchableTypes(sidecar).sort()).toEqual([
      "Exhibition",
      "Place",
    ]);
  });

  test("scopesForType", () => {
    const { fulltext, facets } = scopesForType(sidecar, "Exhibition");
    expect(fulltext).toContain("#/definitions/Exhibition/properties/title");
    expect(facets).toContain("#/definitions/Exhibition/properties/year");
  });
});
