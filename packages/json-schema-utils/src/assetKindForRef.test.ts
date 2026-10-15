import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { compileSchema } from "./schemaRegistry";
import { assetKindForRef } from "./assetKindForRef";

const rootSchema: JSONSchema7 = {
  definitions: {
    Photo: {
      type: "object",
      properties: { "@id": { type: "string" }, url: { type: "string" } },
    },
    Document: {
      type: "object",
      properties: { "@id": { type: "string" }, path: { type: "string" } },
    },
  },
};

describe("assetKindForRef", () => {
  it("resolves array items $ref via registry and assetClasses", () => {
    const registry = compileSchema(rootSchema);
    const ctx = {
      config: {
        registry,
        assetClasses: { Photo: "image" as const, Document: "file" as const },
      },
    };

    expect(
      assetKindForRef(ctx, {
        type: "array",
        items: { $ref: "#/definitions/Photo" },
      }),
    ).toBe("image");

    expect(
      assetKindForRef(ctx, {
        type: "array",
        items: { $ref: "#/definitions/Document" },
      }),
    ).toBe("file");
  });

  it("returns undefined when class is not in assetClasses", () => {
    const registry = compileSchema(rootSchema);
    expect(
      assetKindForRef(
        {
          config: {
            registry,
            assetClasses: { Photo: "image" },
          },
        },
        { $ref: "#/definitions/Document" },
      ),
    ).toBeUndefined();
  });
});
