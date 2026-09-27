import { describe, expect, test } from "bun:test";

import { decodeIRI, encodeIRI } from "./encodeIRI";

describe("encodeIRI / decodeIRI", () => {
  const roundTripCases = [
    "http://example.org/a",
    "https://d-nb.info/gnd/118540238",
    "http://example.org/Müller/Straße",
  ];

  test.each(roundTripCases)("round-trips %s", (iri) => {
    expect(decodeIRI(encodeIRI(iri))).toBe(iri);
  });

  test("encodeIRI output never contains +, /, or =", () => {
    const inputs = [
      ...roundTripCases,
      "http://example.org/?>>",
      "http://example.org/foo/bar/baz",
      "https://example.org/αβγ",
    ];

    for (const iri of inputs) {
      const encoded = encodeIRI(iri);
      expect(encoded).not.toMatch(/[+/=]/);
    }
  });

  test("decodes legacy standard base64", () => {
    const iri = "http://example.org/legacy-item";
    const legacy = Buffer.from(iri).toString("base64");
    expect(decodeIRI(legacy)).toBe(iri);
  });

  test("decodes legacy base64 damaged by query-string parsing", () => {
    const iri = "http://example.org/?foo=bar+baz";
    const legacy = Buffer.from(iri).toString("base64");
    const damaged = legacy.replace(/\+/g, " ");
    expect(decodeIRI(damaged)).toBe(iri);
  });

  test("round-trips without Buffer (browser path)", () => {
    const originalBuffer = globalThis.Buffer;
    // @ts-expect-error simulate browser without Node Buffer
    globalThis.Buffer = undefined;

    try {
      for (const iri of roundTripCases) {
        expect(decodeIRI(encodeIRI(iri))).toBe(iri);
      }
    } finally {
      globalThis.Buffer = originalBuffer;
    }
  });
});
