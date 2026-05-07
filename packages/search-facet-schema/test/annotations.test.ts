import { describe, expect, test } from "bun:test";
import { loadSearchFacetSchema } from "../src/index";

const standaloneSearchFacetSchema = {
  facets: {
    scopes: {
      "#/definitions/Plot/properties/status": { facet: "filter" as const },
      "#/definitions/Plot/properties/createdAt": { facet: "range" as const },
    },
  },
};

describe("search facet schema", () => {
  test("loadSearchFacetSchema validates example document", () => {
    const s = loadSearchFacetSchema(standaloneSearchFacetSchema);
    expect(
      s.facets?.scopes?.["#/definitions/Plot/properties/status"]?.facet,
    ).toBe("filter");
    expect(
      s.facets?.scopes?.["#/definitions/Plot/properties/createdAt"]?.facet,
    ).toBe("range");
  });
});
