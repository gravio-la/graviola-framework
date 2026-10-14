import { describe, expect, test } from "bun:test";

import {
  applyUserOrderedFormChange,
  compareOrderValues,
  fillNewItemOrderValues,
  nextOrderValue,
  normalizeOrderValues,
  orderSpecsFromUiSchema,
  orderValue,
  renumberOrderField,
  sortByOrderField,
  sortDataByOrderSpecs,
  sortIndexedByOrderField,
} from "./orderBy";

describe("compareOrderValues", () => {
  test("sorts numbers numerically", () => {
    const sorted = [12, 11, 2, 1, 8].sort(compareOrderValues);
    expect(sorted).toEqual([1, 2, 8, 11, 12]);
  });

  test("sorts numeric strings with numeric collation", () => {
    expect(compareOrderValues("9", "10")).toBeLessThan(0);
    expect(compareOrderValues("10", "9")).toBeGreaterThan(0);
  });

  test("localeCompare with case and umlauts (base sensitivity)", () => {
    expect(compareOrderValues("äpfel", "Zebra")).toBeLessThan(0);
    expect(compareOrderValues("Banana", "apple")).toBeGreaterThan(0);
  });

  test("nulls sort last relative to values", () => {
    expect(compareOrderValues(null, 1)).toBeGreaterThan(0);
    expect(compareOrderValues(1, null)).toBeLessThan(0);
    expect(compareOrderValues(undefined, 1)).toBeGreaterThan(0);
  });
});

describe("orderValue", () => {
  test("unwraps @value", () => {
    expect(orderValue({ n: { "@value": 5 } }, "n")).toBe(5);
  });

  test("treats empty string as missing", () => {
    expect(orderValue({ n: "" }, "n")).toBeUndefined();
  });
});

describe("sortByOrderField / sortIndexedByOrderField", () => {
  const items = [
    { reihenfolge: 12 },
    { reihenfolge: 11 },
    { reihenfolge: 2 },
    { reihenfolge: 1 },
    { reihenfolge: 8 },
  ];

  test("asc by number field", () => {
    expect(
      sortByOrderField(items, { field: "reihenfolge", direction: "asc" }).map(
        (x) => x.reihenfolge,
      ),
    ).toEqual([1, 2, 8, 11, 12]);
  });

  test("desc reverses valued items only", () => {
    expect(
      sortByOrderField(items, { field: "reihenfolge", direction: "desc" }).map(
        (x) => x.reihenfolge,
      ),
    ).toEqual([12, 11, 8, 2, 1]);
  });

  test("numeric string field values", () => {
    const strItems = [{ v: "10" }, { v: "9" }, { v: "2" }];
    expect(
      sortByOrderField(strItems, { field: "v", direction: "asc" }).map(
        (x) => x.v,
      ),
    ).toEqual(["2", "9", "10"]);
  });

  test("missing values last in original order (asc)", () => {
    const mixed = [{ n: 3 }, { n: undefined }, { n: 1 }, { n: null }, { n: 2 }];
    const sorted = sortByOrderField(mixed, { field: "n", direction: "asc" });
    expect(sorted.map((x) => x.n)).toEqual([1, 2, 3, undefined, null]);
  });

  test("missing values last in original order (desc)", () => {
    const mixed = [{ n: 3 }, { n: undefined }, { n: 1 }, { n: null }, { n: 2 }];
    const sorted = sortByOrderField(mixed, { field: "n", direction: "desc" });
    expect(sorted.map((x) => x.n)).toEqual([3, 2, 1, undefined, null]);
  });

  test("stable for equal values", () => {
    const tie = [
      { n: 1, id: "a" },
      { n: 1, id: "b" },
      { n: 1, id: "c" },
    ];
    const sorted = sortByOrderField(tie, { field: "n", direction: "asc" });
    expect(sorted.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  test("keeps original indices on indexed sort", () => {
    const indexed = sortIndexedByOrderField(items, {
      field: "reihenfolge",
      direction: "asc",
    });
    expect(
      indexed.map(({ item, index }) => ({ r: item.reihenfolge, index })),
    ).toEqual([
      { r: 1, index: 3 },
      { r: 2, index: 2 },
      { r: 8, index: 4 },
      { r: 11, index: 1 },
      { r: 12, index: 0 },
    ]);
  });

  test("no spec preserves order", () => {
    expect(sortByOrderField(items)).toEqual(items);
  });
});

describe("nextOrderValue", () => {
  test("returns 1 on empty list", () => {
    expect(nextOrderValue([], "n")).toBe(1);
  });

  test("max integer + 1 with mixed and missing", () => {
    const items = [
      { n: 3 },
      { n: "5" },
      { n: null },
      { n: { "@value": 7 } },
      { n: 3.5 },
    ];
    expect(nextOrderValue(items, "n")).toBe(8);
  });
});

describe("orderSpecsFromUiSchema", () => {
  test("collects specs from nested layout controls", () => {
    const uischema = {
      type: "VerticalLayout",
      elements: [
        {
          type: "Group",
          elements: [
            {
              type: "Control",
              scope: "#/properties/name",
            },
            {
              type: "Control",
              scope: "#/properties/steps",
              options: {
                orderBy: { field: "position", direction: "asc" as const },
              },
            },
          ],
        },
        {
          type: "Control",
          scope: "#/properties/chapters",
          options: {
            orderBy: { field: "title", direction: "desc" as const },
          },
        },
      ],
    };
    expect(orderSpecsFromUiSchema(uischema)).toEqual({
      steps: { field: "position", direction: "asc" },
      chapters: { field: "title", direction: "desc" },
    });
  });

  test("ignores non top-level property scopes", () => {
    const uischema = {
      type: "Control",
      scope: "#/properties/steps/items/properties/position",
      options: {
        orderBy: { field: "position", direction: "asc" as const },
      },
    };
    expect(orderSpecsFromUiSchema(uischema)).toEqual({});
  });
});

describe("sortDataByOrderSpecs", () => {
  test("shallow copy with sorted arrays", () => {
    const data = {
      steps: [{ n: 2 }, { n: 1 }],
      name: "x",
    };
    const specs = { steps: { field: "n", direction: "asc" as const } };
    const out = sortDataByOrderSpecs(data, specs);
    expect(out).not.toBe(data);
    expect(out.steps).toEqual([{ n: 1 }, { n: 2 }]);
    expect(out.name).toBe("x");
    expect(data.steps).toEqual([{ n: 2 }, { n: 1 }]);
  });

  test("returns same object when unchanged", () => {
    const data = { steps: [{ n: 1 }, { n: 2 }] };
    const specs = { steps: { field: "n", direction: "asc" as const } };
    expect(sortDataByOrderSpecs(data, specs)).toBe(data);
  });
});

describe("fillNewItemOrderValues", () => {
  const specs = { steps: { field: "position", direction: "asc" as const } };
  const integerFields = new Set(["position"]);

  test("fills only appended items lacking the field", () => {
    const prev = {
      steps: [{ position: 1 }, { position: 2 }],
    };
    const next = {
      steps: [{ position: 1 }, { position: 2 }, {}, { position: 4 }],
    };
    const out = fillNewItemOrderValues(prev, next, specs, integerFields);
    expect(out).not.toBe(next);
    expect(out.steps[2]).toEqual({ position: 3 });
    expect(out.steps[3]).toEqual({ position: 4 });
  });

  test("does nothing for non-integer fields", () => {
    const titleSpecs = { steps: { field: "title", direction: "asc" as const } };
    const prev = { steps: [{ title: "a" }] };
    const next = { steps: [{ title: "a" }, {}] };
    expect(fillNewItemOrderValues(prev, next, titleSpecs, integerFields)).toBe(
      next,
    );
  });

  test("does nothing when length unchanged (typing)", () => {
    const prev = { steps: [{ position: 1 }, { position: 2 }] };
    const next = { steps: [{ position: 1 }, { position: 99 }] };
    expect(fillNewItemOrderValues(prev, next, specs, integerFields)).toBe(next);
  });
});

describe("renumberOrderField", () => {
  const spec = { field: "position", direction: "asc" as const };
  const specDesc = { field: "position", direction: "desc" as const };
  const integerFields = new Set(["position"]);

  test("asc: renumbers on pure reorder", () => {
    const a = { "@id": "a", position: 9 };
    const b = { "@id": "b", position: 8 };
    const c = { "@id": "c", position: 7 };
    const prev = [a, b, c];
    const next = [c, a, b];
    const out = renumberOrderField(prev, next, spec, integerFields);
    expect(out).toEqual([
      { "@id": "c", position: 1 },
      { "@id": "a", position: 2 },
      { "@id": "b", position: 3 },
    ]);
  });

  test("desc: renumbers n..1 on pure reorder", () => {
    const a = { position: 1 };
    const b = { position: 2 };
    const prev = [a, b];
    const next = [b, a];
    const out = renumberOrderField(prev, next, specDesc, integerFields);
    expect(out).toEqual([{ position: 2 }, { position: 1 }]);
  });

  test("unchanged when item added or removed", () => {
    const prev = [{ position: 1 }, { position: 2 }];
    const next = [{ position: 1 }, { position: 2 }, { position: 3 }];
    expect(renumberOrderField(prev, next, spec, integerFields)).toBe(next);
  });

  test("unchanged for non-integer order field", () => {
    const prev = [{ title: "a" }, { title: "b" }];
    const next = [{ title: "b" }, { title: "a" }];
    expect(renumberOrderField(prev, next, spec, new Set())).toBe(next);
  });
});

describe("normalizeOrderValues", () => {
  test("renumbers when duplicates or missing", () => {
    const items = [{ n: 3 }, { n: 3 }, { n: undefined }];
    const out = normalizeOrderValues(items, "n");
    expect(out).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  test("unchanged when all unique and present", () => {
    const items = [{ n: 5 }, { n: 2 }];
    expect(normalizeOrderValues(items, "n")).toBe(items);
  });
});

describe("applyUserOrderedFormChange", () => {
  test("fills appended item", () => {
    const specs = { steps: { field: "position", direction: "asc" as const } };
    const integerFields = new Set(["position"]);
    const prev = { steps: [{ position: 1 }] };
    const next = { steps: [{ position: 1 }, {}] };
    const out = applyUserOrderedFormChange(prev, next, specs, integerFields);
    expect(out.steps[1]).toEqual({ position: 2 });
  });

  test("renumbers on up/down reorder", () => {
    const specs = { steps: { field: "position", direction: "asc" as const } };
    const integerFields = new Set(["position"]);
    const a = { "@id": "a", position: 9 };
    const b = { "@id": "b", position: 8 };
    const prev = { steps: [a, b] };
    const next = { steps: [b, a] };
    const out = applyUserOrderedFormChange(prev, next, specs, integerFields);
    expect(out.steps).toEqual([
      { "@id": "b", position: 1 },
      { "@id": "a", position: 2 },
    ]);
  });
});
