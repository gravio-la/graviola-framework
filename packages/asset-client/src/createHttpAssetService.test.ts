import { describe, expect, it } from "bun:test";

import { AssetHttpError } from "./errors";
import { createHttpAssetService } from "./createHttpAssetService";
import { isAssetRefValue, assetIdOfValue } from "./assetRef";

const IRI = "https://example.org/projects/p1/";
const BASE = "/api/projects/p1/assets";

function service(fetchImpl?: typeof fetch) {
  return createHttpAssetService({
    baseUrl: BASE,
    iriPrefix: IRI,
    enabled: true,
    fetch: fetchImpl,
  });
}

describe("createHttpAssetService URL building", () => {
  const svc = service();
  const id = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
  const ref = `${IRI}asset/${id}`;

  it("builds thumb URL with size category and omits dpr=1", () => {
    expect(svc.thumbnailUrl(ref, "card")).toBe(`${BASE}/${id}/thumb?size=card`);
  });

  it("adds dpr when requested", () => {
    expect(svc.thumbnailUrl(ref, "chip", { dpr: 2 })).toBe(
      `${BASE}/${id}/thumb?size=chip&dpr=2`,
    );
  });

  it("uses w/h for explicit dimensions", () => {
    expect(svc.thumbnailUrl(ref, { w: 120, h: 80 })).toBe(
      `${BASE}/${id}/thumb?w=120&h=80`,
    );
  });

  it("builds original URL", () => {
    expect(svc.originalUrl(ref)).toBe(`${BASE}/${id}/original`);
  });
});

describe("isAssetRef / assetIdOf", () => {
  const svc = service();
  const id = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

  it("recognizes IRI and storageKey object", () => {
    expect(svc.isAssetRef(`${IRI}asset/${id}`)).toBe(true);
    expect(svc.assetIdOf(`${IRI}asset/${id}`)).toBe(id);
    expect(
      svc.isAssetRef({ storageKey: `p1/${id}.png`, "@id": "ignored" }),
    ).toBe(true);
    expect(svc.assetIdOf({ storageKey: `p1/${id}.png` })).toBe(id);
  });

  it("rejects other-host IRIs when iriPrefix is configured", () => {
    expect(isAssetRefValue(`https://other.host/foo/asset/${id}`, IRI)).toBe(
      false,
    );
    expect(assetIdOfValue(`https://other.host/foo/asset/${id}`, IRI)).toBe(
      undefined,
    );
  });
});

describe("error mapping", () => {
  it("maps 403/413/415/422 to typed errors", async () => {
    for (const [status, code] of [
      [403, "disabled"],
      [413, "too_large"],
      [415, "type_rejected"],
      [422, "fetch_rejected"],
    ] as const) {
      const fetchImpl = (async () =>
        new Response(JSON.stringify({ error: `err ${status}` }), {
          status,
        })) as unknown as typeof fetch;
      const svc = service(fetchImpl);
      await expect(
        svc.importFromUrl("https://example.com/x.png"),
      ).rejects.toMatchObject({
        status,
        code,
      });
    }
  });

  it("wraps upload failures", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ error: "nope" }), {
        status: 415,
      })) as unknown as typeof fetch;
    const svc = service(fetchImpl);
    const file = new File(["x"], "a.bin", { type: "application/octet-stream" });
    await expect(svc.upload(file)).rejects.toBeInstanceOf(AssetHttpError);
  });
});
