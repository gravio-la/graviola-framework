import type { JSONSchema7 } from "json-schema";
import { describe, expect, it } from "bun:test";
import {
  applyMetaStampingOnWrite,
  baseMetaSchemaProfile,
  composeMetaSchemaProfile,
  deriveExtendedSchema,
  deriveMetaProfileForStamping,
  documentHasClientMeta,
  ENTITY_META_JSON_KEY,
  ENTITY_META_PERSISTENCE_KEY,
  extendMetaSchema,
  flattenMetaSchemaProfile,
  isMetaAnnotationScope,
  metaScopeToAccessorPath,
  metaScopeToSparqlColumnId,
  remapEntityMetaForPersistence,
  remapEntityMetaFromPersistence,
  stripClientMetaFromDocument,
} from "./index";

const domainSchema: JSONSchema7 = {
  $id: "https://example.org/garden",
  definitions: {
    Garden: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        patch: { $ref: "#/definitions/Patch" },
      },
    },
    Patch: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        label: { type: "string" },
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
          },
        },
      },
    },
  },
};

describe("meta-schema", () => {
  it("inlineMetaSchema grafts object properties without EntityMeta definition", () => {
    const extended = deriveExtendedSchema(domainSchema, baseMetaSchemaProfile, {
      inlineMetaSchema: true,
      includeLifecycle: true,
    });
    expect(extended.definitions?.EntityMeta).toBeUndefined();
    const garden = extended.definitions?.Garden as JSONSchema7;
    const entityMeta = garden.properties?.[
      ENTITY_META_PERSISTENCE_KEY
    ] as JSONSchema7;
    expect(entityMeta.type).toBe("object");
    expect(entityMeta.properties?.modified).toBeDefined();
  });

  it("deriveExtendedSchema grafts $meta when graftPropertyKey configured", () => {
    const extended = deriveExtendedSchema(domainSchema, baseMetaSchemaProfile, {
      includeLifecycle: true,
      graftPropertyKey: ENTITY_META_JSON_KEY,
    });
    const garden = extended.definitions?.Garden as JSONSchema7;
    expect(garden.properties?.[ENTITY_META_JSON_KEY]).toBeDefined();
    expect(garden.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeUndefined();
  });

  it("meta scope alias utilities map UI scopes to persistence paths", () => {
    const scope = "#/properties/$meta/properties/modified";
    expect(isMetaAnnotationScope(scope)).toBe(true);
    expect(metaScopeToAccessorPath(scope)).toBe("$meta.modified");
    expect(metaScopeToSparqlColumnId(scope)).toBe("entityMeta_modified_single");
  });

  it("deriveExtendedSchema grafts entity meta at CBD boundaries only", () => {
    const extended = deriveExtendedSchema(domainSchema, baseMetaSchemaProfile, {
      includeLifecycle: true,
    });
    const garden = extended.definitions?.Garden as JSONSchema7;
    const patch = extended.definitions?.Patch as JSONSchema7;
    expect(garden.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeDefined();
    expect(patch.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeDefined();
    expect(patch.properties?.address).toBeDefined();
    const address = patch.properties?.address as JSONSchema7;
    expect(address.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeUndefined();
  });

  it("grafts entityMeta at Prisma id boundaries when identityKeys configured", () => {
    const prismaDomain: JSONSchema7 = {
      definitions: {
        Category: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };
    const extended = deriveExtendedSchema(prismaDomain, baseMetaSchemaProfile, {
      identityKeys: ["id"],
      includeLifecycle: true,
    });
    const category = extended.definitions?.Category as JSONSchema7;
    expect(category.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeDefined();
  });

  it("extendMetaSchema composes via allOf", () => {
    const extended = extendMetaSchema(baseMetaSchemaProfile, {
      type: "object",
      properties: {
        reviewStatus: { type: "string" },
      },
    });
    expect(extended.allOf).toHaveLength(2);
  });

  it("strips and stamps $meta on named entities", () => {
    const extended = deriveExtendedSchema(domainSchema, baseMetaSchemaProfile, {
      includeLifecycle: true,
    });
    const doc = {
      "@id": "https://example.org/garden/1",
      name: "North",
      patch: {
        "@id": "https://example.org/patch/1",
        label: "A",
        $meta: { modified: "client", schemaFingerprint: "bad" },
      },
      $meta: { modified: "client", schemaFingerprint: "bad" },
    };

    expect(documentHasClientMeta(doc)).toBe(true);

    const stamped = applyMetaStampingOnWrite(
      doc,
      "Garden",
      extended,
      {
        schemaVersion: "1.0.0",
        schemaFingerprint: "sha256-test",
        lifecycleTimestamps: "application",
        now: () => "2026-07-09T10:00:00.000Z",
      },
      null,
    );

    expect(stamped.$meta).toEqual({
      created: "2026-07-09T10:00:00.000Z",
      modified: "2026-07-09T10:00:00.000Z",
      schemaVersion: "1.0.0",
      schemaFingerprint: "sha256-test",
    });
    expect(stamped.patch.$meta).toEqual({
      created: "2026-07-09T10:00:00.000Z",
      modified: "2026-07-09T10:00:00.000Z",
      schemaVersion: "1.0.0",
      schemaFingerprint: "sha256-test",
    });
  });

  it("stripClientMetaFromDocument removes nested client meta", () => {
    const extended = deriveExtendedSchema(domainSchema);
    const stripped = stripClientMetaFromDocument({
      "@id": "https://example.org/garden/1",
      $meta: { modified: "x" },
      patch: {
        "@id": "https://example.org/patch/1",
        $meta: { modified: "y" },
      },
    });
    expect(stripped.$meta).toBeUndefined();
    expect(stripped.patch.$meta).toBeUndefined();
  });

  it("remaps $meta to persistence key for store write", () => {
    const doc = {
      "@id": "https://example.org/garden/1",
      $meta: { modified: "t", schemaFingerprint: "fp" },
    };
    const persisted = remapEntityMetaForPersistence(doc);
    expect(persisted.$meta).toBeUndefined();
    expect(persisted[ENTITY_META_PERSISTENCE_KEY]).toEqual({
      modified: "t",
      schemaFingerprint: "fp",
    });
    expect(remapEntityMetaFromPersistence(persisted).$meta).toEqual({
      modified: "t",
      schemaFingerprint: "fp",
    });
  });

  it("composeMetaSchemaProfile omits lifecycle when disabled", () => {
    const profile = composeMetaSchemaProfile({ includeLifecycle: false });
    expect(profile.properties?.created).toBeUndefined();
    expect(profile.properties?.schemaFingerprint).toBeDefined();
  });

  it("deriveMetaProfileForStamping respects lifecycleTimestamps", () => {
    const withLifecycle = deriveMetaProfileForStamping({
      schemaFingerprint: "fp",
      lifecycleTimestamps: "application",
    });
    expect(withLifecycle.properties?.modified).toBeDefined();

    const without = deriveMetaProfileForStamping({
      schemaFingerprint: "fp",
      lifecycleTimestamps: false,
    });
    expect(without.properties?.modified).toBeUndefined();
  });

  it("database-native mode skips application lifecycle stamp", () => {
    const stamped = applyMetaStampingOnWrite(
      { "@id": "https://example.org/garden/1", name: "X" },
      "Garden",
      deriveExtendedSchema(domainSchema, baseMetaSchemaProfile, {
        includeLifecycle: true,
      }),
      {
        schemaFingerprint: "sha256-test",
        lifecycleTimestamps: "database-native",
        now: () => "2026-07-09T10:00:00.000Z",
      },
      null,
    );
    expect(stamped.$meta?.schemaFingerprint).toBe("sha256-test");
    expect(stamped.$meta?.created).toBeUndefined();
    expect(stamped.$meta?.modified).toBeUndefined();
  });

  it("rejects client $meta when configured", () => {
    const extended = deriveExtendedSchema(domainSchema, baseMetaSchemaProfile, {
      includeLifecycle: true,
    });
    expect(() =>
      applyMetaStampingOnWrite(
        {
          "@id": "https://example.org/garden/1",
          $meta: { modified: "client", schemaFingerprint: "bad" },
        },
        "Garden",
        extended,
        {
          schemaFingerprint: "sha256-test",
          rejectClientMeta: true,
        },
      ),
    ).toThrow(/Client-supplied \$meta/);
  });

  it("metaScopeToSparqlColumnId maps container vs leaf scopes", () => {
    expect(metaScopeToSparqlColumnId("#/properties/$meta")).toBe(
      "$meta_single",
    );
    expect(
      metaScopeToSparqlColumnId("#/properties/$meta/properties/modified"),
    ).toBe("entityMeta_modified_single");
  });

  it("flattenMetaSchemaProfile merges allOf branches", () => {
    const flat = flattenMetaSchemaProfile(
      extendMetaSchema(baseMetaSchemaProfile, {
        type: "object",
        properties: {
          reviewStatus: { type: "string" },
        },
      }),
    );
    expect(flat.allOf).toBeUndefined();
    expect(flat.properties?.created).toBeDefined();
    expect(flat.properties?.reviewStatus).toBeDefined();
  });
});
