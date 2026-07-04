import { describe, expect, test } from "bun:test";
import {
  extractWikidataIRIFromSameAsLinks,
  extractWikidataQIdFromIRI,
  parseAdminParentIdsFromClaims,
} from "./mappings/slubLodAccess";

describe("SLUB LOD Wikidata admin hierarchy helpers", () => {
  test("extractWikidataIRIFromSameAsLinks finds @id-shaped and string entries", () => {
    expect(
      extractWikidataIRIFromSameAsLinks([
        { "@id": "https://d-nb.info/gnd/4031541-1" },
        "http://www.wikidata.org/entity/Q1829",
      ]),
    ).toBe("http://www.wikidata.org/entity/Q1829");

    expect(
      extractWikidataIRIFromSameAsLinks([
        { "@id": "http://www.wikidata.org/entity/Q1829" },
      ]),
    ).toBe("http://www.wikidata.org/entity/Q1829");
  });

  test("extractWikidataIRIFromSameAsLinks falls back to isBasedOn wikidata link", () => {
    expect(
      extractWikidataIRIFromSameAsLinks([
        {
          "@id": "https://de.wikipedia.org/wiki/Kaliningrad",
          isBasedOn: { "@id": "http://www.wikidata.org/entity/Q1829" },
        },
      ]),
    ).toBe("http://www.wikidata.org/entity/Q1829");
  });

  test("extractWikidataIRIFromSameAsLinks returns null when no Wikidata link", () => {
    expect(
      extractWikidataIRIFromSameAsLinks([{ "@id": "https://d-nb.info/gnd/1" }]),
    ).toBeNull();
    expect(extractWikidataIRIFromSameAsLinks(undefined)).toBeNull();
  });

  test("extractWikidataQIdFromIRI parses bare Q-IDs", () => {
    expect(
      extractWikidataQIdFromIRI("http://www.wikidata.org/entity/Q1829"),
    ).toBe("Q1829");
    expect(extractWikidataQIdFromIRI("http://example.org/Q1829")).toBeNull();
  });

  test("parseAdminParentIdsFromClaims prefers P131 over P361", () => {
    const claims = {
      P131: [
        {
          mainsnak: {
            datavalue: { value: { id: "Q1749" } },
          },
        },
      ],
      P361: [
        {
          mainsnak: {
            datavalue: { value: { id: "Q159" } },
          },
        },
      ],
    };
    expect(parseAdminParentIdsFromClaims(claims)).toEqual(["Q1749"]);
  });

  test("parseAdminParentIdsFromClaims falls back to P361 when P131 is empty", () => {
    const claims = {
      P131: [],
      P361: [
        {
          mainsnak: {
            datavalue: { value: { id: "Q159" } },
          },
        },
      ],
    };
    expect(parseAdminParentIdsFromClaims(claims)).toEqual(["Q159"]);
  });
});
