import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import {
  isArrayOfInlineObjects,
  isArrayOfNamedEntitys,
  isEntityLikeObjectSchema,
  isInlineObject,
  isNamedEntity,
} from "./structural";

describe("isEntityLikeObjectSchema", () => {
  it("matches objects with @id", () => {
    expect(
      isEntityLikeObjectSchema({
        type: "object",
        properties: { "@id": { type: "string" } },
      }),
    ).toBe(true);
  });

  it("matches objects with @type", () => {
    expect(
      isEntityLikeObjectSchema({
        type: "object",
        properties: { "@type": { type: "string" } },
      }),
    ).toBe(true);
  });

  it("rejects plain embedded objects", () => {
    expect(
      isEntityLikeObjectSchema({
        type: "object",
        properties: { name: { type: "string" } },
      }),
    ).toBe(false);
  });
});

describe("entity structural testers", () => {
  const typedEntity: JSONSchema7 = {
    type: "object",
    properties: {
      "@type": { type: "string" },
      name: { type: "string" },
    },
  };

  const inlineObject: JSONSchema7 = {
    type: "object",
    properties: { year: { type: "integer" } },
  };

  it("routes typed objects to named entity renderer", () => {
    expect(
      isNamedEntity(undefined as never, typedEntity, undefined as never),
    ).toBe(true);
    expect(
      isInlineObject(undefined as never, typedEntity, undefined as never),
    ).toBe(false);
  });

  it("routes typed object arrays to array entity renderer", () => {
    const arraySchema: JSONSchema7 = {
      type: "array",
      items: typedEntity,
    };
    expect(
      isArrayOfNamedEntitys(
        undefined as never,
        arraySchema,
        undefined as never,
      ),
    ).toBe(true);
    expect(
      isArrayOfInlineObjects(
        undefined as never,
        arraySchema,
        undefined as never,
      ),
    ).toBe(false);
  });

  it("keeps anonymous objects on inline renderers", () => {
    expect(
      isInlineObject(undefined as never, inlineObject, undefined as never),
    ).toBe(true);
    expect(
      isNamedEntity(undefined as never, inlineObject, undefined as never),
    ).toBe(false);
  });
});
