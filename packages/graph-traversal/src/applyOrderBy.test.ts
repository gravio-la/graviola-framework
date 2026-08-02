import { describe, expect, test } from "bun:test";
import {
  applyIncludeOrderByAndSlice,
  compareByOrderBy,
  sortObjectArrayByOrderBy,
} from "./applyOrderBy";

describe("applyOrderBy", () => {
  const tags = [
    { name: "zebra", rank: 3 },
    { name: "apple", rank: 1 },
    { name: "mango", rank: 2 },
  ];

  test("sortObjectArrayByOrderBy asc/desc", () => {
    expect(
      sortObjectArrayByOrderBy(tags, { name: "asc" }).map((t) => t.name),
    ).toEqual(["apple", "mango", "zebra"]);
    expect(
      sortObjectArrayByOrderBy(tags, { name: "desc" }).map((t) => t.name),
    ).toEqual(["zebra", "mango", "apple"]);
  });

  test("compareByOrderBy multi-key", () => {
    const a = { name: "a", rank: 2 };
    const b = { name: "a", rank: 1 };
    expect(
      compareByOrderBy(a, b, [{ name: "asc" }, { rank: "asc" }]),
    ).toBeGreaterThan(0);
  });

  test("applyIncludeOrderByAndSlice sorts and slices", () => {
    const doc = { tags: [...tags] };
    applyIncludeOrderByAndSlice(
      doc,
      { tags: { take: 2, orderBy: { name: "asc" } } },
      { slice: true },
    );
    expect(doc.tags.map((t) => t.name)).toEqual(["apple", "mango"]);
  });

  test("applyIncludeOrderByAndSlice sort-only when slice=false", () => {
    const doc = { tags: [...tags] };
    applyIncludeOrderByAndSlice(
      doc,
      { tags: { take: 2, orderBy: { name: "asc" } } },
      { slice: false },
    );
    expect(doc.tags.map((t) => t.name)).toEqual(["apple", "mango", "zebra"]);
  });
});
