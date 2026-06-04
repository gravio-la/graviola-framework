import type { JSONSchema7 } from "json-schema";

import {
  dataInFrame,
  enterArrayDetailFrame,
  resolveInFrame,
  rootFrame,
} from "./schemaScopeFrame";

/** Inline nested schema (no $ref) for stable resolver tests. */
const flatNestedSchema: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string", format: "iri" },
    name: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          subItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                image: { type: "string", format: "iri" },
              },
            },
          },
        },
      },
    },
  },
};

const sampleData = {
  "@id": "http://example.org/e/1",
  name: "Root",
  items: [
    {
      name: "Item 1",
      subItems: [{ name: "Sub 1", image: "http://example.org/img/1" }],
    },
  ],
};

describe("schemaScopeFrame", () => {
  it("resolves entity-level name against Entity local root", () => {
    const frame = rootFrame(flatNestedSchema);
    const r = resolveInFrame(frame, "#/properties/name");
    expect(r?.schema.type).toBe("string");
    expect(dataInFrame(frame, sampleData)).toEqual(sampleData);
    expect((dataInFrame(frame, sampleData) as { name?: string })?.name).toBe(
      "Root",
    );
  });

  it("resets local root at items detail boundary", () => {
    const root = rootFrame(flatNestedSchema);
    const itemFrame = enterArrayDetailFrame(root, "#/properties/items", 0);
    expect(itemFrame).toBeDefined();
    const nameRes = resolveInFrame(itemFrame!, "#/properties/name");
    expect(nameRes?.schema.type).toBe("string");
    expect(dataInFrame(itemFrame!, sampleData)).toEqual(sampleData.items[0]);
  });

  it("resolves nested subItems detail against SubItem schema", () => {
    const root = rootFrame(flatNestedSchema);
    const itemFrame = enterArrayDetailFrame(root, "#/properties/items", 0)!;
    const subFrame = enterArrayDetailFrame(
      itemFrame,
      "#/properties/subItems",
      0,
    )!;
    const nameRes = resolveInFrame(subFrame, "#/properties/name");
    expect(nameRes?.schema.type).toBe("string");
    expect(dataInFrame(subFrame, sampleData)).toEqual({
      name: "Sub 1",
      image: "http://example.org/img/1",
    });
  });
});
