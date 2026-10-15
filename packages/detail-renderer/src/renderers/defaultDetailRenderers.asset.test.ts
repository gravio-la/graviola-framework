import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import maxBy from "lodash-es/maxBy";
import {
  arrayOfAssetRefsTester,
  assetRefTester,
} from "@graviola/edb-detail-renderer-core";
import {
  bringDefinitionToTop,
  compileSchema,
} from "@graviola/json-schema-utils";
import { defaultDetailRenderers } from "./registries";

describe("defaultDetailRenderers asset dispatch", () => {
  it("prefers asset renderers for asset-class scopes on the entity root schema", () => {
    const documentRoot: JSONSchema7 = {
      definitions: {
        ImageObject: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/ImageObject" },
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
            author: { $ref: "#/definitions/Person" },
          },
        },
      },
    };
    const entitySchema = bringDefinitionToTop(documentRoot, "Fundstueck");
    const ctx = {
      rootSchema: entitySchema,
      depth: 0,
      maxDepth: 6,
      assetClasses: { ImageObject: "image" as const },
      schemaRegistry: compileSchema(documentRoot),
    };
    const testerCtx = { rootSchema: entitySchema, config: ctx };

    const pick = (scope: string) =>
      maxBy(defaultDetailRenderers, (e) =>
        e.tester({ type: "Control", scope }, entitySchema, testerCtx),
      )?.tester;

    expect(pick("#/properties/image")).toBe(assetRefTester);
    expect(pick("#/properties/fotos")).toBe(arrayOfAssetRefsTester);
    expect(pick("#/properties/author")).not.toBe(assetRefTester);
  });
});
