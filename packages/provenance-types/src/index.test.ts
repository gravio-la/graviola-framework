import { describe, expect, test } from "bun:test";
import { generationActivityToPredicates, PROV, RDF, STMT } from "./index";

describe("generationActivityToPredicates", () => {
  test("emits gra and prov keys for a full activity", () => {
    const out = generationActivityToPredicates({
      formulaId: "#/properties/total",
      stratum: 2,
      inputFingerprint: "sha256-abc",
      generatedAt: "2026-08-06T09:00:00.000Z",
      agent: "https://example.org/agent",
    });
    expect(out["gra:formulaId"]).toBe("#/properties/total");
    expect(out["gra:stratum"]).toBe(2);
    expect(out["gra:inputFingerprint"]).toBe("sha256-abc");
    expect(out[PROV.generatedAtTime]).toBe("2026-08-06T09:00:00.000Z");
    expect(out[PROV.wasAttributedTo]).toBe("https://example.org/agent");
  });

  test("returns empty object for empty activity", () => {
    expect(generationActivityToPredicates({})).toEqual({});
  });
});

describe("vocabulary constants", () => {
  test("RDF.reifies IRI", () => {
    expect(RDF.reifies).toBe(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies",
    );
  });

  test("STMT.about IRI", () => {
    expect(STMT.about).toBe("https://graviola.gra.one/ns/stmt/about");
  });
});
