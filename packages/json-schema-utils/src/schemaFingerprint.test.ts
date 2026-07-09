import type { JSONSchema7 } from "json-schema";
import {
  canonicalizeSchemaForFingerprint,
  schemaFingerprintSync,
  schemaIdentityOfSync,
  versionFingerprintDriftWarning,
} from "./schemaFingerprint";

const baseSchema: JSONSchema7 = {
  $id: "https://example.org/test",
  version: "1.0.0",
  definitions: {
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        price: { type: "number" },
      },
    },
  },
};

describe("schemaFingerprint", () => {
  it("is stable across property order", () => {
    const shuffled: JSONSchema7 = {
      version: "1.0.0",
      $id: "https://example.org/test",
      definitions: {
        Item: {
          type: "object",
          properties: {
            price: { type: "number" },
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    };
    expect(schemaFingerprintSync(baseSchema)).toBe(
      schemaFingerprintSync(shuffled),
    );
  });

  it("changes on semantic difference", () => {
    const changed: JSONSchema7 = {
      ...baseSchema,
      definitions: {
        Item: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            price: { type: "integer" },
          },
        },
      },
    };
    expect(schemaFingerprintSync(baseSchema)).not.toBe(
      schemaFingerprintSync(changed),
    );
  });

  it("is stable when $defs is used instead of definitions", () => {
    const withDefs: JSONSchema7 = {
      $id: "https://example.org/test",
      version: "1.0.0",
      $defs: {
        Item: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            price: { type: "number" },
          },
        },
      },
    };
    expect(schemaFingerprintSync(baseSchema)).toBe(
      schemaFingerprintSync(withDefs),
    );
  });

  it("excludes version from fingerprint input", () => {
    const v2 = { ...baseSchema, version: "2.0.0" } as JSONSchema7 & {
      version: string;
    };
    expect(schemaFingerprintSync(baseSchema)).toBe(schemaFingerprintSync(v2));
  });

  it("schemaIdentityOf includes version and fingerprint separately", () => {
    const id = schemaIdentityOfSync(baseSchema);
    expect(id.version).toBe("1.0.0");
    expect(id.schema).toBe("https://example.org/test");
    expect(id.fingerprint).toMatch(/^sha256-[a-f0-9]{64}$/);
  });

  it("versionFingerprintDriftWarning fires on same version, new content", () => {
    const prev = schemaIdentityOfSync(baseSchema);
    const changed = schemaIdentityOfSync({
      ...baseSchema,
      definitions: {
        Item: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            sku: { type: "string" },
          },
        },
      },
    });
    const warn = versionFingerprintDriftWarning(prev, changed);
    expect(warn).toContain("bump the version");
  });

  it("canonicalize sorts keys", () => {
    const canon = canonicalizeSchemaForFingerprint(baseSchema);
    expect(Object.keys(canon)).toEqual(["$id", "definitions"]);
  });
});
