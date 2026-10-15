import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { compileSchema } from "@graviola/json-schema-utils";
import { namedEntityTester as namedEntityRank } from "./structural";
import { imageUriTester } from "./structural";
import {
  assetRefTester,
  arrayOfAssetRefsTester,
  assetValueRefTester,
} from "./assetRef";
import type { DetailTesterContext } from "../types";

const rootSchema: JSONSchema7 = {
  definitions: {
    Photo: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Photo" },
        fileName: { type: "string" },
        encodingFormat: { type: "string" },
      },
    },
    Document: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Document" },
      },
    },
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Item" },
        title: { type: "string" },
      },
    },
  },
};

function ctxWithAssets(): DetailTesterContext {
  const schemaRegistry = compileSchema(rootSchema);
  return {
    rootSchema,
    depth: 0,
    maxDepth: 6,
    assetClasses: { Photo: "image", Document: "file" },
    schemaRegistry,
  };
}

describe("asset ref testers", () => {
  const testerCtx = (ctx: DetailTesterContext) => ({
    rootSchema,
    config: ctx,
  });

  const photoRefSchema: JSONSchema7 = {
    type: "object",
    properties: {
      "@id": { type: "string" },
      "@type": { const: "https://ex.org/Photo" },
    },
  };

  const itemSchema: JSONSchema7 = {
    type: "object",
    properties: {
      "@id": { type: "string" },
      "@type": { const: "https://ex.org/Item" },
    },
  };

  it("assetRefTester ranks above namedEntity and image URI testers", () => {
    const ctx = ctxWithAssets();
    const ui = { type: "Control", scope: "#" };
    expect(assetRefTester(ui, photoRefSchema, testerCtx(ctx))).toBe(6);
    expect(namedEntityRank(ui, photoRefSchema, testerCtx(ctx))).toBe(5);
    expect(
      imageUriTester(
        ui,
        {
          type: "string",
          format: "uri",
          contentMediaType: "image/png",
        } as never,
        testerCtx(ctx),
      ),
    ).toBe(5);
  });

  it("does not match non-asset entity classes", () => {
    const ctx = ctxWithAssets();
    const ui = { type: "Control", scope: "#" };
    expect(assetRefTester(ui, itemSchema, testerCtx(ctx))).toBe(-1);
    expect(assetValueRefTester(ui, itemSchema, testerCtx(ctx))).toBe(-1);
  });

  it("matches asset $ref via scope when the form root schema is passed", () => {
    const entitySchema: JSONSchema7 = {
      type: "object",
      properties: {
        photo: { $ref: "#/definitions/Photo" },
        photos: {
          type: "array",
          items: { $ref: "#/definitions/Photo" },
        },
      },
      definitions: rootSchema.definitions,
    };
    const ctx = ctxWithAssets();
    const testerCtx = { rootSchema: entitySchema, config: ctx };
    const uiPhoto = { type: "Control", scope: "#/properties/photo" };
    const uiPhotos = { type: "Control", scope: "#/properties/photos" };
    expect(assetRefTester(uiPhoto, entitySchema, testerCtx)).toBe(6);
    expect(arrayOfAssetRefsTester(uiPhotos, entitySchema, testerCtx)).toBe(6);
  });

  it("arrayOfAssetRefsTester matches photo arrays", () => {
    const ctx = ctxWithAssets();
    const ui = { type: "Control", scope: "#" };
    const arraySchema: JSONSchema7 = {
      type: "array",
      items: {
        type: "object",
        properties: {
          "@id": { type: "string" },
          "@type": { const: "https://ex.org/Photo" },
        },
      },
    };
    expect(arrayOfAssetRefsTester(ui, arraySchema, testerCtx(ctx))).toBe(6);
  });
});
