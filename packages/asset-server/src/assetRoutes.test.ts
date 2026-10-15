import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

import { createAssetRoutes } from "./assetRoutes.js";
import { createAssetStore } from "./assetStore.js";
import { FsStorageAdapter } from "./fsStorageAdapter.js";
import { signPicturiumToken } from "./picturiumSigner.js";
import { tinyPng } from "./testFixtures.js";

function buildApp(options: {
  root: string;
  policyEnabled?: boolean;
  maxBytes?: number;
  picturiumPort?: number;
}) {
  const storage = FsStorageAdapter({ rootDir: options.root });
  const store = createAssetStore({
    storage,
    maxBytes: options.maxBytes ?? 1024 * 1024,
    accept: ["image/*", "application/pdf"],
    picturium: {
      baseUrl: `http://127.0.0.1:${options.picturiumPort ?? 9}`,
      key: "secret",
      dataDir: options.root,
    },
  });
  const routes = createAssetRoutes({
    assetStore: store,
    accept: ["image/*"],
    defaultMaxBytes: options.maxBytes ?? 1024 * 1024,
    iriPrefix: (projectId) => `https://example.org/projects/${projectId}/`,
    policy: async () => ({
      enabled: options.policyEnabled ?? true,
      maxBytes: options.maxBytes,
    }),
  });
  const app = new Hono();
  app.route("/api/projects/:projectId/assets", routes);
  return { app, store, storage };
}

describe("createAssetRoutes", () => {
  test("mount pattern and upload/read metadata", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "asset-routes-"));
    try {
      const { app } = buildApp({ root });
      const png = tinyPng();
      const form = new FormData();
      form.append("file", new Blob([png], { type: "image/png" }), "x.png");

      const post = await app.request("/api/projects/p1/assets", {
        method: "POST",
        body: form,
      });
      expect(post.status).toBe(201);
      const created = (await post.json()) as { assetId: string; iri: string };
      expect(created.iri).toBe(
        `https://example.org/projects/p1/asset/${created.assetId}`,
      );

      const get = await app.request(
        `/api/projects/p1/assets/${created.assetId}`,
      );
      expect(get.status).toBe(200);

      const disabled = buildApp({ root, policyEnabled: false });
      const blocked = await disabled.app.request("/api/projects/p1/assets", {
        method: "POST",
        body: form,
      });
      expect(blocked.status).toBe(403);

      const readWhenDisabled = await disabled.app.request(
        `/api/projects/p1/assets/${created.assetId}`,
      );
      expect(readWhenDisabled.status).toBe(200);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("413 and 415 status codes", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "asset-routes-"));
    try {
      const { app } = buildApp({ root, maxBytes: 8 });
      const form = new FormData();
      form.append(
        "file",
        new Blob([tinyPng()], { type: "image/png" }),
        "x.png",
      );
      const tooBig = await app.request("/api/projects/p1/assets", {
        method: "POST",
        body: form,
      });
      expect(tooBig.status).toBe(413);

      const textForm = new FormData();
      textForm.append(
        "file",
        new Blob([new TextEncoder().encode("hello")], { type: "text/plain" }),
        "x.txt",
      );
      const wrongType = await app.request("/api/projects/p1/assets", {
        method: "POST",
        body: textForm,
      });
      expect(wrongType.status).toBe(415);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("thumb route proxies fake picturium with valid token", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "asset-routes-"));
    const pictServer = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");
        const entries = [...url.searchParams.entries()]
          .filter(([k]) => k !== "token")
          .sort(([a], [b]) => a.localeCompare(b));
        const params = Object.fromEntries(entries);
        const rawPath = url.pathname
          .slice(1)
          .split("/")
          .map((seg) => decodeURIComponent(seg))
          .join("/");
        const expected = signPicturiumToken(rawPath, params, "secret");
        if (token !== expected) {
          return new Response("bad token", { status: 403 });
        }
        return new Response(new Uint8Array([9, 8, 7]), {
          headers: { "content-type": "image/webp" },
        });
      },
    });

    try {
      const { app, store } = buildApp({
        root,
        picturiumPort: pictServer.port!,
      });
      const asset = await store.ingest("p1", {
        body: tinyPng(),
        fileName: "chip.png",
      });
      const abs = store.thumbnailUrl(asset, { size: "chip", format: "webp" });
      expect(abs).toBeDefined();

      const res = await app.request(
        `/api/projects/p1/assets/${asset.assetId}/thumb?size=chip`,
        { headers: { Accept: "image/webp" } },
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toContain("immutable");
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes).toEqual(new Uint8Array([9, 8, 7]));
    } finally {
      pictServer.stop();
      await rm(root, { recursive: true, force: true });
    }
  });
});
