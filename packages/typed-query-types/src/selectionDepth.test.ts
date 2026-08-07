import { describe, expect, it } from "bun:test";
import {
  resolveEffectiveMaxRecursion,
  selectionDepth,
  SelectionTruncationError,
  truncatedSelectionPaths,
} from "./selectionDepth";

describe("selectionDepth", () => {
  it("returns 0 for empty/absent include", () => {
    expect(selectionDepth(undefined)).toBe(0);
    expect(selectionDepth({})).toBe(0);
  });

  it("counts boolean includes as depth 1", () => {
    expect(selectionDepth({ patch: true })).toBe(1);
  });

  it("counts nested include trees", () => {
    expect(
      selectionDepth({
        patch: { include: { plots: true } },
      }),
    ).toBe(2);
    expect(
      selectionDepth({
        a: {
          include: {
            b: {
              include: {
                c: {
                  include: { d: { include: { e: true } } },
                },
              },
            },
          },
        },
      }),
    ).toBe(5);
  });
});

describe("resolveEffectiveMaxRecursion", () => {
  it("defaults to 4 when no include and no explicit max", () => {
    expect(resolveEffectiveMaxRecursion({})).toBe(4);
  });

  it("honours selection depth when include is present", () => {
    expect(
      resolveEffectiveMaxRecursion({
        include: {
          a: {
            include: {
              b: {
                include: {
                  c: {
                    include: { d: { include: { e: true } } },
                  },
                },
              },
            },
          },
        },
      }),
    ).toBe(5);
  });

  it("throws when explicit maxRecursion truncates the selection", () => {
    expect(() =>
      resolveEffectiveMaxRecursion({
        include: { a: { include: { b: { include: { c: true } } } } },
        maxRecursion: 1,
      }),
    ).toThrow(SelectionTruncationError);
  });

  it("lists truncated paths", () => {
    const paths = truncatedSelectionPaths(
      { a: { include: { b: { include: { c: true } } } } },
      1,
    );
    expect(paths).toEqual(["a.b"]);
  });
});
