import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  bringDefinitionToTop,
  compileSchema,
} from "@graviola/json-schema-utils";
import {
  assetFieldTester,
  assetGalleryTester,
  ASSET_FIELD_TESTER_RANK,
  ASSET_GALLERY_TESTER_RANK,
} from "./assetTesters";

const documentRoot: JSONSchema7 = {
  definitions: {
    ImageObject: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "http://example.org/ImageObject" },
      },
    },
    MediaObject: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "http://example.org/MediaObject" },
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
    Fundstueck: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "http://example.org/Fundstueck" },
        image: { $ref: "#/definitions/ImageObject" },
        fotos: {
          type: "array",
          items: { $ref: "#/definitions/ImageObject" },
        },
        fundbericht: { $ref: "#/definitions/MediaObject" },
        author: { $ref: "#/definitions/Person" },
      },
    },
  },
};

const formSchema = bringDefinitionToTop(documentRoot, "Fundstueck");
const registry = compileSchema(documentRoot);
const jsonFormsCtx = {
  rootSchema: formSchema,
  config: {
    registry,
    assetClasses: {
      ImageObject: "image" as const,
      MediaObject: "file" as const,
    },
  },
};

describe("asset testers", () => {
  it("matches asset refs when JSON Forms passes the form root schema", () => {
    expect(
      assetFieldTester(
        { type: "Control", scope: "#/properties/image" },
        formSchema,
        jsonFormsCtx,
      ),
    ).toBe(ASSET_FIELD_TESTER_RANK);
    expect(
      assetGalleryTester(
        { type: "Control", scope: "#/properties/fotos" },
        formSchema,
        jsonFormsCtx,
      ),
    ).toBe(ASSET_GALLERY_TESTER_RANK);
    expect(
      assetFieldTester(
        { type: "Control", scope: "#/properties/author" },
        formSchema,
        jsonFormsCtx,
      ),
    ).toBe(-1);
  });

  it("matches fundbericht media ref and ignores non-asset author", () => {
    expect(
      assetFieldTester(
        {
          type: "Control",
          scope: "#/properties/image",
          options: { dropdown: true },
        },
        formSchema,
        jsonFormsCtx,
      ),
    ).toBe(ASSET_FIELD_TESTER_RANK);
    expect(
      assetFieldTester(
        { type: "Control", scope: "#/properties/fundbericht" },
        formSchema,
        jsonFormsCtx,
      ),
    ).toBe(ASSET_FIELD_TESTER_RANK);
  });

  it("ranks above linked-data renderers that also match asset refs", () => {
    expect(ASSET_FIELD_TESTER_RANK).toBeGreaterThan(20);
    expect(ASSET_GALLERY_TESTER_RANK).toBeGreaterThan(6);
  });
});
