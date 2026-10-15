import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import maxBy from "lodash-es/maxBy";
import { assetFieldTester, assetGalleryTester } from "@graviola/asset-renderer";
import { imageUrlTester } from "@graviola/edb-basic-renderer";
import {
  bringDefinitionToTop,
  compileSchema,
} from "@graviola/json-schema-utils";
import { defaultRenderers } from "./defaultRenderers";

describe("defaultRenderers", () => {
  it("registers asset and image URL renderers", () => {
    const testers = defaultRenderers.map((e) => e.tester);
    expect(testers).toContain(assetFieldTester);
    expect(testers).toContain(imageUrlTester);
  });

  it("selects asset renderers for asset-class properties on the form root schema", () => {
    const documentRoot: JSONSchema7 = {
      definitions: {
        ImageObject: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/ImageObject" },
          },
        },
        MediaObject: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/MediaObject" },
          },
        },
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/Person" },
          },
        },
        Fundstueck: {
          type: "object",
          properties: {
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
    const ctx = {
      rootSchema: formSchema,
      config: {
        registry: compileSchema(documentRoot),
        assetClasses: { ImageObject: "image", MediaObject: "file" },
      },
    };

    const pick = (scope: string, options?: Record<string, unknown>) =>
      maxBy(defaultRenderers, (e) =>
        e.tester({ type: "Control", scope, options }, formSchema, ctx),
      )?.tester;

    expect(pick("#/properties/image", { dropdown: true })).toBe(
      assetFieldTester,
    );
    expect(pick("#/properties/fotos")).toBe(assetGalleryTester);
    expect(pick("#/properties/fundbericht")).toBe(assetFieldTester);
    expect(pick("#/properties/author")).not.toBe(assetFieldTester);
  });
});
