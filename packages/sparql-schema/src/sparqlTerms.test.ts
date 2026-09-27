import { describe, expect, test } from "bun:test";

import { InvalidIriError } from "@graviola/edb-core-utils";
import {
  iriRef,
  sparqlStringLiteral,
  toSparqlVariableName,
} from "./sparqlTerms";

describe("iriRef", () => {
  test("wraps safe IRIs", () => {
    expect(iriRef("http://example.org/a")).toBe("<http://example.org/a>");
  });

  test("throws InvalidIriError for unsafe IRIs", () => {
    expect(() => iriRef('http://example.org/x">')).toThrow(InvalidIriError);
  });
});

describe("sparqlStringLiteral", () => {
  test("escapes SPARQL string special characters", () => {
    expect(sparqlStringLiteral('a"b')).toBe('"a\\"b"');
    expect(sparqlStringLiteral("a\\b")).toBe('"a\\\\b"');
    expect(sparqlStringLiteral("a\nb")).toBe('"a\\nb"');
    expect(sparqlStringLiteral("a\rb")).toBe('"a\\rb"');
    expect(sparqlStringLiteral("a\tb")).toBe('"a\\tb"');
    expect(sparqlStringLiteral("a\bb")).toBe('"a\\bb"');
    expect(sparqlStringLiteral("a\fb")).toBe('"a\\fb"');
  });
});

describe("toSparqlVariableName", () => {
  test("replaces non-alphanumeric characters", () => {
    expect(toSparqlVariableName("foo:bar")).toBe("foo_bar");
  });

  test("prefixes names that do not start with a letter", () => {
    expect(toSparqlVariableName("123")).toBe("var_123");
  });
});
