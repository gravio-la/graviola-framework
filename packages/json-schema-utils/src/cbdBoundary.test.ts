import type { JSONSchema7 } from "json-schema";
import {
  cbdBoundaryScopes,
  entityIdentityFromIdKey,
  isNamedEntityBoundaryAtScope,
  JSONLD_ENTITY_ID_KEY,
  PRISMA_ENTITY_ID_KEY,
} from "./cbdBoundary";

const schema: JSONSchema7 = {
  $id: "https://example.org/garden",
  definitions: {
    Garden: {
      type: "object",
      properties: {
        [JSONLD_ENTITY_ID_KEY]: { type: "string" },
        name: { type: "string" },
        patch: { $ref: "#/definitions/Patch" },
      },
    },
    Patch: {
      type: "object",
      properties: {
        [JSONLD_ENTITY_ID_KEY]: { type: "string" },
        label: { type: "string" },
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
          },
        },
      },
    },
  },
};

describe("cbdBoundary", () => {
  it("finds named-entity scopes with @id (default)", () => {
    const scopes = cbdBoundaryScopes(schema);
    const pointerScopes = scopes.map((s) => s.scope);
    expect(pointerScopes).toContain("#/definitions/Garden");
    expect(pointerScopes).toContain("#/definitions/Patch");
    expect(pointerScopes.some((s) => s.includes("address"))).toBe(false);
  });

  it("finds named-entity scopes with plain id when configured", () => {
    const prismaSchema: JSONSchema7 = {
      definitions: {
        Category: {
          type: "object",
          properties: {
            [PRISMA_ENTITY_ID_KEY]: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };
    expect(cbdBoundaryScopes(prismaSchema).map((s) => s.scope)).toEqual([]);

    expect(
      cbdBoundaryScopes(
        prismaSchema,
        entityIdentityFromIdKey(PRISMA_ENTITY_ID_KEY),
      ).map((s) => s.scope),
    ).toContain("#/definitions/Category");
  });

  it("supports custom identity keys", () => {
    const customSchema: JSONSchema7 = {
      definitions: {
        Widget: {
          type: "object",
          properties: {
            entityId: { type: "string" },
            label: { type: "string" },
          },
        },
      },
    };
    const opts = entityIdentityFromIdKey("entityId");
    expect(cbdBoundaryScopes(customSchema, opts).map((s) => s.scope)).toContain(
      "#/definitions/Widget",
    );
  });

  it("isNamedEntityBoundaryAtScope respects identityKeys", () => {
    expect(isNamedEntityBoundaryAtScope(schema, "#/definitions/Garden")).toBe(
      true,
    );
    expect(
      isNamedEntityBoundaryAtScope(
        schema,
        "#/definitions/Patch/properties/address",
      ),
    ).toBe(false);

    const prismaSchema: JSONSchema7 = {
      definitions: {
        Category: {
          type: "object",
          properties: { id: { type: "string" }, name: { type: "string" } },
        },
      },
    };
    expect(
      isNamedEntityBoundaryAtScope(
        prismaSchema,
        "#/definitions/Category",
        entityIdentityFromIdKey("id"),
      ),
    ).toBe(true);
    expect(
      isNamedEntityBoundaryAtScope(prismaSchema, "#/definitions/Category"),
    ).toBe(false);
  });

  it("walks $defs and reports definitionName", () => {
    const withDefs: JSONSchema7 = {
      $defs: {
        Place: {
          type: "object",
          properties: {
            [JSONLD_ENTITY_ID_KEY]: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };
    const scopes = cbdBoundaryScopes(withDefs);
    expect(scopes).toContainEqual({
      scope: "#/$defs/Place",
      definitionName: "Place",
    });
  });
});
