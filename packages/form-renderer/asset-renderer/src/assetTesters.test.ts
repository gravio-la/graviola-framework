import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { compileSchema } from "@graviola/json-schema-utils";
import {
  assetFieldTester,
  assetGalleryTester,
  ASSET_FIELD_TESTER_RANK,
  ASSET_GALLERY_TESTER_RANK,
} from "./assetTesters";
const rootSchema: JSONSchema7 = {
  definitions: {
    Photo: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "http://example.org/Photo" },
      },
    },
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "http://example.org/Person" },
        name: { type: "string" },
      },
    },
  },
};

const registry = compileSchema(rootSchema);
const ctx = {
  config: {
    registry,
    assetClasses: { Photo: "image" as const },
  },
};

describe("asset testers", () => {
  it("assetFieldTester matches asset class $ref only", () => {
    const uischema = { type: "Control", scope: "#/properties/cover" };
    expect(
      assetFieldTester(uischema, { $ref: "#/definitions/Photo" }, { ...ctx }),
    ).toBe(ASSET_FIELD_TESTER_RANK);
    expect(
      assetFieldTester(uischema, { $ref: "#/definitions/Person" }, { ...ctx }),
    ).toBe(-1);
  });

  it("assetGalleryTester matches array of asset items", () => {
    const uischema = { type: "Control", scope: "#/properties/gallery" };
    expect(
      assetGalleryTester(
        uischema,
        {
          type: "array",
          items: { $ref: "#/definitions/Photo" },
        },
        { ...ctx },
      ),
    ).toBe(ASSET_GALLERY_TESTER_RANK);
    expect(
      assetGalleryTester(
        uischema,
        {
          type: "array",
          items: { $ref: "#/definitions/Person" },
        },
        { ...ctx },
      ),
    ).toBe(-1);
  });

  it("ranks above linked-data renderers", () => {
    expect(ASSET_FIELD_TESTER_RANK).toBeGreaterThan(20);
    expect(ASSET_GALLERY_TESTER_RANK).toBeGreaterThan(5);
  });
});
