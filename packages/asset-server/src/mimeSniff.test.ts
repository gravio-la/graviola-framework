import { describe, expect, test } from "bun:test";

import { sniffMime } from "./mimeSniff.js";
import { tinyPng } from "./testFixtures.js";

describe("sniffMime", () => {
  test("magic bytes win over claimed HTML", () => {
    const png = tinyPng();
    const r = sniffMime(png, "text/html");
    expect(r.encodingFormat).toBe("image/png");
  });

  test("unknown bytes with image/png claim become octet-stream", () => {
    const r = sniffMime(new TextEncoder().encode("not an image"), "image/png");
    expect(r.encodingFormat).toBe("application/octet-stream");
  });

  test("active claimed types become octet-stream", () => {
    const r = sniffMime(new TextEncoder().encode("<html></html>"), "text/html");
    expect(r.encodingFormat).toBe("application/octet-stream");
  });

  test("allows whitelisted text/plain claim when magic unknown", () => {
    const r = sniffMime(new TextEncoder().encode("hello"), "text/plain");
    expect(r.encodingFormat).toBe("text/plain");
  });
});
