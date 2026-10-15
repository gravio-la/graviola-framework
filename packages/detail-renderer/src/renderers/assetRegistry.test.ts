import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { compileSchema } from "@graviola/json-schema-utils";
import {
  selectEntry,
  type DetailTesterContext,
} from "@graviola/edb-detail-renderer-core";

import { AssetRefRenderer } from "./AssetRefRenderer";
import { AssetGalleryValueRenderer } from "../value-renderers/AssetGalleryValueRenderer";
import { NamedEntityRenderer } from "./NamedEntityRenderer";

const rootSchema: JSONSchema7 = {
  definitions: {
    Photo: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Photo" },
      },
    },
  },
};

describe("asset registry selection", () => {
  const ctx: DetailTesterContext = {
    rootSchema,
    depth: 0,
    maxDepth: 6,
    assetClasses: { Photo: "image" },
    schemaRegistry: compileSchema(rootSchema),
  };

  it("selectEntry picks asset renderers for asset classes only", async () => {
    const { defaultDetailRenderers } = await import("./registries");
    const photoSchema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Photo" },
      },
    };
    const ui = { type: "Control", scope: "#/properties/photo" };
    const entry = selectEntry(defaultDetailRenderers, ui, photoSchema, ctx);
    expect(entry?.renderer).toBe(AssetRefRenderer);
    expect(entry?.renderer).not.toBe(NamedEntityRenderer);

    const arraySchema: JSONSchema7 = { type: "array", items: photoSchema };
    const arrayEntry = selectEntry(
      defaultDetailRenderers,
      { type: "Control", scope: "#/properties/photos" },
      arraySchema,
      ctx,
    );
    expect(arrayEntry?.renderer).toBe(AssetGalleryValueRenderer);
  });
});
