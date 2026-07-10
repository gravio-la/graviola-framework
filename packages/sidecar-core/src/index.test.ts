import { describe, expect, it } from "bun:test";
import {
  createSidecarDocument,
  formatAppliesToLabel,
  validateSidecar,
} from "./index";

describe("sidecar-core", () => {
  const documentSchema = "https://graviola.gra.one/example-companion/v1";
  const identity = {
    schema: "https://example.org/schema",
    version: "1.0.0",
    fingerprint: "sha256-abc",
  };

  it("creates sidecar with appliesTo identity", () => {
    const doc = createSidecarDocument(documentSchema, identity, {
      "#/definitions/Item/properties/name": { label: "Name" },
    });
    expect(doc.$schema).toBe(documentSchema);
    expect(doc.appliesTo.version).toBe("1.0.0");
    expect(doc.slots["#/definitions/Item/properties/name"]).toBeDefined();
  });

  it("validates fingerprint match and known scopes", () => {
    const sidecar = createSidecarDocument(documentSchema, identity, {
      "#/definitions/Item/properties/name": {},
      "#/definitions/Item/properties/missing": {},
    });
    const result = validateSidecar(sidecar, identity, [
      "#/definitions/Item/properties/name",
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.kind === "dangling-scope")).toBe(true);
  });

  it("reports invalid-payload separately from dangling-scope", () => {
    const sidecar = createSidecarDocument(documentSchema, identity, {
      "#/definitions/Item/properties/name": {},
    });
    const result = validateSidecar(
      sidecar,
      identity,
      ["#/definitions/Item/properties/name"],
      () => "payload rejected",
    );
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        kind: "invalid-payload",
        scope: "#/definitions/Item/properties/name",
        message: "payload rejected",
      },
    ]);
  });

  it("prefers version-content-drift over fingerprint-mismatch when versions match", () => {
    const sidecar = createSidecarDocument(
      documentSchema,
      { ...identity, fingerprint: "sha256-stale" },
      {},
    );
    const result = validateSidecar(sidecar, identity, []);
    expect(result.issues.map((i) => i.kind)).toEqual(["version-content-drift"]);
  });

  it("formatAppliesToLabel includes version and fingerprint", () => {
    expect(formatAppliesToLabel(identity)).toContain("v1.0.0");
    expect(formatAppliesToLabel(identity)).toContain("sha256-abc");
  });
});
