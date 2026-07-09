import type { JSONSchema7 } from "json-schema";
import { describe, expect, it } from "bun:test";
import {
  applyMetaStampingOnWrite,
  baseMetaSchemaProfile,
  deriveExtendedSchema,
  documentHasClientMeta,
  ENTITY_META_PERSISTENCE_KEY,
  extendMetaSchema,
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
  it("deriveExtendedSchema grafts entity meta at CBD boundaries only", () => {
    const extended = deriveExtendedSchema(domainSchema);
    const garden = extended.definitions?.Garden as JSONSchema7;
    const patch = extended.definitions?.Patch as JSONSchema7;
    expect(garden.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeDefined();
    expect(patch.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeDefined();
    expect(patch.properties?.address).toBeDefined();
    const address = patch.properties?.address as JSONSchema7;
    expect(address.properties?.[ENTITY_META_PERSISTENCE_KEY]).toBeUndefined();
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
    const extended = deriveExtendedSchema(domainSchema);
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

  it("rejects client $meta when configured", () => {
    const extended = deriveExtendedSchema(domainSchema);
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
});
