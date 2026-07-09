import { describe, expect, it } from "bun:test";
import {
  createSidecarDocument,
  formatAppliesToLabel,
  validateSidecar,
} from "./index";

describe("sidecar-core", () => {
  const identity = {
    schema: "https://example.org/schema",
    version: "1.0.0",
    fingerprint: "sha256-abc",
  };

  it("creates sidecar with appliesTo identity", () => {
    const doc = createSidecarDocument(identity, {
      "#/definitions/Item/properties/name": { label: "Name" },
    });
    expect(doc.appliesTo.version).toBe("1.0.0");
    expect(doc.slots["#/definitions/Item/properties/name"]).toBeDefined();
  });

  it("validates fingerprint match and known scopes", () => {
    const sidecar = createSidecarDocument(identity, {
      "#/definitions/Item/properties/name": {},
      "#/definitions/Item/properties/missing": {},
    });
    const result = validateSidecar(sidecar, identity, [
      "#/definitions/Item/properties/name",
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.kind === "dangling-scope")).toBe(true);
  });

  it("formatAppliesToLabel includes version and fingerprint", () => {
    expect(formatAppliesToLabel(identity)).toContain("v1.0.0");
    expect(formatAppliesToLabel(identity)).toContain("sha256-abc");
  });
});
