import { describe, expect, test } from "bun:test";

import { SafeFetchError } from "./errors.js";
import { safeFetch } from "./safeFetch.js";

describe("safeFetch", () => {
  test("rejects private IP literal", async () => {
    await expect(safeFetch("http://127.0.0.1/test")).rejects.toMatchObject({
      code: "private_target",
    });
  });

  test("rejects hostname resolving to loopback", async () => {
    await expect(
      safeFetch("http://evil.example/test", {
        lookup: async () => [{ address: "127.0.0.1" }],
      }),
    ).rejects.toMatchObject({ code: "private_target" });
  });

  test("rejects redirect to private target", async () => {
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        if (req.url.endsWith("/start")) {
          return Response.redirect("http://127.0.0.1/secret", 302);
        }
        return new Response("ok");
      },
    });
    const port = server.port!;
    const host = `127.0.0.1:${port}`;
    try {
      await expect(
        safeFetch(`http://${host}/start`, {
          lookup: async (hostname) => {
            if (hostname === "127.0.0.1") return [{ address: "203.0.113.10" }];
            return [{ address: "127.0.0.1" }];
          },
        }),
      ).rejects.toMatchObject({ code: "private_target" });
    } finally {
      server.stop();
    }
  });

  test("rejects oversize body", async () => {
    const server = Bun.serve({
      port: 0,
      fetch() {
        return new Response(new Uint8Array(32), {
          headers: { "content-type": "application/octet-stream" },
        });
      },
    });
    const port = server.port!;
    try {
      await expect(
        safeFetch(`http://127.0.0.1:${port}/big`, {
          maxBytes: 8,
          lookup: async () => [{ address: "203.0.113.10" }],
        }),
      ).rejects.toBeInstanceOf(SafeFetchError);
    } finally {
      server.stop();
    }
  });

  test("rejects IPv4-mapped loopback", async () => {
    await expect(safeFetch("http://[::ffff:127.0.0.1]/")).rejects.toMatchObject(
      { code: "private_target" },
    );
  });

  test("rejects non-2xx responses", async () => {
    await expect(
      safeFetch("http://example.com/missing", {
        lookup: async () => [{ address: "93.184.216.34" }],
        fetchImpl: async () => new Response("nope", { status: 404 }),
      }),
    ).rejects.toMatchObject({ code: "bad_status" });
  });

  test("strips sensitive query params from finalUrl", async () => {
    const result = await safeFetch(
      "https://example.com/a?token=secret&keep=1",
      {
        lookup: async () => [{ address: "93.184.216.34" }],
        fetchImpl: async () =>
          new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
            status: 200,
            headers: { "content-type": "image/png" },
          }),
      },
    );
    expect(result.finalUrl).not.toContain("token=");
    expect(result.finalUrl).toContain("keep=1");
  });

  test("rejects wrong content-type", async () => {
    await expect(
      safeFetch("http://example.com/asset.bin", {
        accept: ["image/*"],
        lookup: async () => [{ address: "93.184.216.34" }],
        fetchImpl: async (_url, _init) =>
          new Response("not-image", {
            headers: { "content-type": "text/plain" },
          }),
      }),
    ).rejects.toMatchObject({ code: "content_type_rejected" });
  });
});
