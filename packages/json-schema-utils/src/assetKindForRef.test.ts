import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { compileSchema } from "./schemaRegistry";
import { assetKindForRef } from "./assetKindForRef";

const rootSchema: JSONSchema7 = {
  definitions: {
    Photo: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Photo" },
        url: { type: "string" },
      },
    },
    Document: {
      type: "object",
      properties: { "@id": { type: "string" }, path: { type: "string" } },
    },
  },
};

describe("assetKindForRef", () => {
  it("resolves form stub refs (<Class>Stub) to the asset class", () => {
    const withStub: JSONSchema7 = {
      definitions: {
        ...rootSchema.definitions,
        PhotoStub: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/Photo" },
          },
        },
      },
    };
    const ctx = {
      config: {
        registry: compileSchema(withStub),
        assetClasses: { Photo: "image" as const },
      },
    };
    expect(assetKindForRef(ctx, { $ref: "#/definitions/PhotoStub" })).toBe(
      "image",
    );
    expect(
      assetKindForRef(ctx, {
        type: "array",
        items: { $ref: "#/definitions/PhotoStub" },
      }),
    ).toBe("image");
  });

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

  it("resolves inlined entity shape via @type when $ref is absent", () => {
    const registry = compileSchema(rootSchema);
    expect(
      assetKindForRef(
        {
          config: {
            registry,
            assetClasses: { Photo: "image" },
          },
        },
        {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/Photo" },
          },
        },
      ),
    ).toBe("image");
  });

  it("resolves inlined stub entity shape via @type when registry entry is *Stub", () => {
    const withStub: JSONSchema7 = {
      definitions: {
        ...rootSchema.definitions,
        PhotoStub: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/Photo" },
          },
        },
      },
    };
    const ctx = {
      config: {
        registry: compileSchema(withStub),
        assetClasses: { Photo: "image" as const },
      },
    };
    expect(
      assetKindForRef(ctx, {
        type: "object",
        properties: {
          "@id": { type: "string" },
          "@type": { const: "https://ex.org/Photo" },
        },
      }),
    ).toBe("image");
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
