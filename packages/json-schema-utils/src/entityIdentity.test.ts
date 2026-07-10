import { describe, expect, it } from "bun:test";
import {
  DEFAULT_ENTITY_IDENTITY,
  entityIdFromInstance,
  entityIdentityFromIdKey,
  isNamedEntityInstance,
  JSONLD_ENTITY_ID_KEY,
  PRISMA_ENTITY_ID_KEY,
  resolveEntityIdentityKeys,
} from "./entityIdentity";

describe("entityIdentity", () => {
  it("defaults to @id", () => {
    expect(resolveEntityIdentityKeys()).toEqual([JSONLD_ENTITY_ID_KEY]);
    expect(resolveEntityIdentityKeys(undefined)).toEqual([
      JSONLD_ENTITY_ID_KEY,
    ]);
    expect(DEFAULT_ENTITY_IDENTITY.identityKeys).toEqual([
      JSONLD_ENTITY_ID_KEY,
    ]);
  });

  it("entityIdentityFromIdKey mirrors extendSchemaShortcut idKey", () => {
    expect(entityIdentityFromIdKey("id")).toEqual({
      identityKeys: ["id"],
    });
  });

  it("entityIdFromInstance reads configured keys in order", () => {
    const entity = { id: "row-1", [JSONLD_ENTITY_ID_KEY]: "iri-1" };
    expect(entityIdFromInstance(entity, entityIdentityFromIdKey("id"))).toBe(
      "row-1",
    );
    expect(entityIdFromInstance(entity)).toBe("iri-1");
  });

  it("isNamedEntityInstance uses configured keys only", () => {
    expect(isNamedEntityInstance({ id: "x" })).toBe(false);
    expect(
      isNamedEntityInstance({ id: "x" }, entityIdentityFromIdKey("id")),
    ).toBe(true);
    expect(
      isNamedEntityInstance(
        { [PRISMA_ENTITY_ID_KEY]: "x" },
        entityIdentityFromIdKey(PRISMA_ENTITY_ID_KEY),
      ),
    ).toBe(true);
  });
});
