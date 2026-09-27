import { describe, expect, test } from "bun:test";

import { assertSafeIri, InvalidIriError, isSafeIri } from "./iriValidation";

describe("isSafeIri", () => {
  test("accepts http and urn IRIs", () => {
    expect(isSafeIri("http://example.org/x")).toBe(true);
    expect(isSafeIri("urn:uuid:550e8400-e29b-41d4-a716-446655440000")).toBe(
      true,
    );
  });

  test("rejects missing scheme", () => {
    expect(isSafeIri("example.org/x")).toBe(false);
    expect(isSafeIri("/relative/path")).toBe(false);
  });

  test("rejects forbidden characters", () => {
    expect(isSafeIri('http://example.org/x">')).toBe(false);
    expect(isSafeIri("http://example.org/x y")).toBe(false);
    expect(isSafeIri('http://example.org/x"')).toBe(false);
    expect(isSafeIri("http://example.org/x{")).toBe(false);
    expect(isSafeIri("http://example.org/x\n")).toBe(false);
  });
});

describe("assertSafeIri", () => {
  test("returns the IRI or throws InvalidIriError", () => {
    expect(assertSafeIri("http://example.org/x")).toBe("http://example.org/x");
    expect(() => assertSafeIri("http://example.org/x> }")).toThrow(
      InvalidIriError,
    );
  });
});
