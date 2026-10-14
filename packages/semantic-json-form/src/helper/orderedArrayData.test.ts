import { describe, expect, test } from "bun:test";

import {
  applyUserFormDataOrder,
  integerFieldsForOrderSpecs,
  sortLoadedFormData,
} from "./orderedArrayData";

describe("integerFieldsForOrderSpecs", () => {
  const schema = {
    type: "object",
    properties: {
      steps: {
        type: "array",
        items: { $ref: "#/definitions/Step" },
      },
    },
    definitions: {
      Step: {
        type: "object",
        properties: {
          position: { type: "integer" },
          title: { type: "string" },
        },
      },
    },
  };

  test("includes integer order fields from item definition", () => {
    const specs = { steps: { field: "position", direction: "asc" as const } };
    expect(integerFieldsForOrderSpecs(schema, specs)).toEqual(
      new Set(["position"]),
    );
  });

  test("skips non-integer order fields", () => {
    const specs = { steps: { field: "title", direction: "asc" as const } };
    expect(integerFieldsForOrderSpecs(schema, specs)).toEqual(new Set());
  });
});

describe("sortLoadedFormData / applyUserFormDataOrder", () => {
  const specs = { steps: { field: "position", direction: "asc" as const } };
  const integerFields = new Set(["position"]);

  test("sorts on load", () => {
    const data = { steps: [{ position: 2 }, { position: 1 }] };
    expect(sortLoadedFormData(data, specs).steps).toEqual([
      { position: 1 },
      { position: 2 },
    ]);
  });

  test("fills new item without sorting while typing", () => {
    const prev = { steps: [{ position: 1 }] };
    const next = { steps: [{ position: 99 }] };
    expect(applyUserFormDataOrder(prev, next, specs, integerFields)).toBe(next);
  });
});
