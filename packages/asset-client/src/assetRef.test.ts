import { describe, expect, it } from "bun:test";

import { assetIdOfValue, isAssetRefValue } from "./assetRef";

const IRI = "https://example.org/projects/p1/";
const id = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

describe("isAssetRefValue with iriPrefix", () => {
  it("accepts only prefixed IRIs", () => {
    expect(isAssetRefValue(`${IRI}asset/${id}`, { iriPrefix: IRI })).toBe(true);
    expect(
      isAssetRefValue(`https://other.host/foo/asset/${id}`, {
        iriPrefix: IRI,
      }),
    ).toBe(false);
    expect(isAssetRefValue(id, { iriPrefix: IRI })).toBe(false);
  });

  it("storageKey requires project prefix when projectId set", () => {
    expect(
      isAssetRefValue(
        { storageKey: `p1/${id}.png` },
        { iriPrefix: IRI, projectId: "p1" },
      ),
    ).toBe(true);
    expect(
      isAssetRefValue(
        { storageKey: `p2/${id}.png` },
        { iriPrefix: IRI, projectId: "p1" },
      ),
    ).toBe(false);
  });
});

describe("isAssetRefValue without iriPrefix", () => {
  it("accepts bare ULID and /asset/ tail on any host", () => {
    expect(isAssetRefValue(id)).toBe(true);
    expect(isAssetRefValue(`https://other.host/foo/asset/${id}`)).toBe(true);
    expect(assetIdOfValue(`https://other.host/foo/asset/${id}`)).toBe(id);
  });
});
