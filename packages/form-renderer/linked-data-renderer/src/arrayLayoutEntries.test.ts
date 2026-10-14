import { describe, expect, test } from "bun:test";

import { buildArrayLayoutEntries } from "./arrayLayoutEntries";

describe("buildArrayLayoutEntries", () => {
  test("sorts by order field while keeping original data indices", () => {
    const data = [
      { "@id": "a", reihenfolge: 3 },
      { "@id": "b", reihenfolge: 1 },
      { "@id": "c", reihenfolge: 2 },
    ];
    const entries = buildArrayLayoutEntries(data, {
      orderBySpec: { field: "reihenfolge", direction: "asc" },
      getItemId: (item) => (item as { "@id": string })["@id"],
      getItemLabel: (_, index) => `item-${index}`,
    });
    expect(entries.map((e) => e.childData)).toEqual([
      data[1],
      data[2],
      data[0],
    ]);
    expect(entries.map((e) => e.index)).toEqual([1, 2, 0]);
  });

  test("uses per-item labels for default label sort", () => {
    const data = [{ label: "Zebra" }, { label: "Alpha" }];
    const entries = buildArrayLayoutEntries(data, {
      getItemId: (_, index) => index,
      getItemLabel: (child) => (child as { label: string }).label,
    });
    expect(entries.map((e) => e.label)).toEqual(["Alpha", "Zebra"]);
  });

  test("keeps anonymous items distinct for uniqBy", () => {
    const data = [{ n: 1 }, { n: 2 }, { n: 3 }];
    const entries = buildArrayLayoutEntries(data, {
      getItemId: () => undefined,
      getItemLabel: (child) => (child as { n: number }).n,
    });
    expect(entries).toHaveLength(3);
  });
});
