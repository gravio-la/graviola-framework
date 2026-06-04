import { describe, expect, it } from "bun:test";

import { shouldWrapValueInPropertyRow } from "./renderValue";

describe("shouldWrapValueInPropertyRow", () => {
  it("wraps for detail and undefined viewSize", () => {
    expect(
      shouldWrapValueInPropertyRow({
        rootSchema: {},
        depth: 0,
        maxDepth: 3,
        viewSize: "detail",
      }),
    ).toBe(true);
    expect(
      shouldWrapValueInPropertyRow({
        rootSchema: {},
        depth: 0,
        maxDepth: 3,
      }),
    ).toBe(true);
  });

  it("does not wrap for compact view sizes", () => {
    for (const viewSize of ["chip", "listItem", "card"] as const) {
      expect(
        shouldWrapValueInPropertyRow({
          rootSchema: {},
          depth: 0,
          maxDepth: 3,
          viewSize,
        }),
      ).toBe(false);
    }
  });
});
