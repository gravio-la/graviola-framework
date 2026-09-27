import { describe, expect, test } from "bun:test";

import { InvalidIriError } from "@graviola/edb-core-utils";
import { makeSPARQLWherePart } from "./makeSPARQLWherePart";

describe("makeSPARQLWherePart", () => {
  test("produces unchanged output for normal IRIs", () => {
    const entityIRI = "http://example.org/person/1";
    const typeIRI = "http://example.org/types/Person";

    expect(makeSPARQLWherePart(entityIRI, typeIRI)).toBe(
      ` VALUES ?subject { <http://example.org/person/1> } ?subject a <http://example.org/types/Person> . `,
    );
    expect(
      makeSPARQLWherePart([entityIRI, "http://example.org/person/2"], typeIRI),
    ).toBe(
      ` VALUES ?subject { <http://example.org/person/1> <http://example.org/person/2> } ?subject a <http://example.org/types/Person> . `,
    );
  });

  test("throws InvalidIriError for a malicious entity IRI", () => {
    expect(() =>
      makeSPARQLWherePart(
        "http://example.org/x> } UNION { ?entity ?p ?o . #",
        "http://example.org/types/Person",
      ),
    ).toThrow(InvalidIriError);
  });

  test("throws InvalidIriError for a malicious type IRI", () => {
    expect(() =>
      makeSPARQLWherePart(
        "http://example.org/person/1",
        "http://example.org/types/Person>",
      ),
    ).toThrow(InvalidIriError);
  });
});
