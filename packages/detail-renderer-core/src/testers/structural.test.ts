import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { resolvePropertySchema } from "../traverse/dispatch";
import {
  isArrayOfInlineObjects,
  isArrayOfNamedEntitys,
  isEntityLikeObjectSchema,
  isInlineObject,
  isNamedEntity,
} from "./structural";

/** LinkML `gra:anonymous` — `@type` only, no `@id` (CBD blank nodes). */
const linkmlAnonymousRecipeSchema: JSONSchema7 = {
  $defs: {
    Rezept: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Rezept" },
        titel: { type: "string" },
        schritte: {
          type: "array",
          items: { $ref: "#/$defs/RezeptSchritt" },
        },
        herkunft: { $ref: "#/$defs/Herkunft" },
      },
    },
    RezeptSchritt: {
      type: "object",
      properties: {
        "@type": { const: "https://ex.org/RezeptSchritt" },
        rang: { type: "integer" },
        text: { type: "string" },
      },
    },
    Herkunft: {
      type: "object",
      properties: {
        "@type": { const: "https://ex.org/Herkunft" },
        name: { type: "string" },
      },
    },
  },
};

describe("isEntityLikeObjectSchema", () => {
  it("matches objects with @id", () => {
    expect(
      isEntityLikeObjectSchema({
        type: "object",
        properties: { "@id": { type: "string" } },
      }),
    ).toBe(true);
  });

  it("does not treat @type-only objects as named entities", () => {
    expect(
      isEntityLikeObjectSchema({
        type: "object",
        properties: { "@type": { type: "string" } },
      }),
    ).toBe(false);
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

  it("routes @type-only objects to inline renderer (anonymous / blank node)", () => {
    expect(
      isNamedEntity(undefined as never, typedEntity, undefined as never),
    ).toBe(false);
    expect(
      isInlineObject(undefined as never, typedEntity, undefined as never),
    ).toBe(true);
  });

  it("routes @type-only object arrays to inline array renderer", () => {
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
    ).toBe(false);
    expect(
      isArrayOfInlineObjects(
        undefined as never,
        arraySchema,
        undefined as never,
      ),
    ).toBe(true);
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

describe("LinkML gra:anonymous classes (blank nodes)", () => {
  const root = linkmlAnonymousRecipeSchema;
  const rezeptProps = linkmlAnonymousRecipeSchema.$defs!.Rezept!
    .properties as Record<string, JSONSchema7>;

  const neverCtx = undefined as never;

  it("treats @type-only defs as inline, named Rezept as entity", () => {
    const herkunft = resolvePropertySchema(rezeptProps.herkunft, root);
    const schritte = resolvePropertySchema(rezeptProps.schritte, root);
    const rezept = linkmlAnonymousRecipeSchema.$defs!.Rezept as JSONSchema7;

    expect(isInlineObject(neverCtx, herkunft, neverCtx)).toBe(true);
    expect(isNamedEntity(neverCtx, herkunft, neverCtx)).toBe(false);

    expect(isArrayOfInlineObjects(neverCtx, schritte, neverCtx)).toBe(true);
    expect(isArrayOfNamedEntitys(neverCtx, schritte, neverCtx)).toBe(false);

    expect(isInlineObject(neverCtx, rezept, neverCtx)).toBe(false);
    expect(isNamedEntity(neverCtx, rezept, neverCtx)).toBe(true);
  });
});
