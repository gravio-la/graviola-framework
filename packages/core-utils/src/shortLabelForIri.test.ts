import { describe, expect, test } from "bun:test";

import { shortLabelForIri } from "./shortLabelForIri";

describe("shortLabelForIri", () => {
  test("uses last path segment", () => {
    expect(shortLabelForIri("http://example.org/entity/item/abc")).toBe("abc");
  });

  test("uses fragment when path is empty", () => {
    expect(
      shortLabelForIri(
        "http://semanticdesk.top/entity#directory/deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      ),
    ).toBe("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
  });
});
