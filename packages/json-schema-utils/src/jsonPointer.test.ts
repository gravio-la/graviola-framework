import { describe, expect, it } from "bun:test";

import { decode, encode } from "./jsonPointer";

describe("jsonPointer", () => {
  it("decodes all ~0 sequences", () => {
    expect(decode("a~0b~0c")).toBe("a~b~c");
  });

  it("decodes ~1 as /", () => {
    expect(decode("a~1b")).toBe("a/b");
  });

  it("decodes ~1 before ~0 per RFC 6901", () => {
    expect(decode("~01")).toBe("~1");
  });

  it("encodes / and ~", () => {
    expect(encode("a/b~c")).toBe("a~1b~0c");
  });

  it("round-trips encode/decode", () => {
    const input = "x/y~z~~/";
    expect(decode(encode(input))).toBe(input);
  });
});
