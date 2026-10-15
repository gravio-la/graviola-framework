import { Hono } from "hono";

import type { AssetStore } from "./assetStore.js";
import { AssetStoreError, SafeFetchError } from "./errors.js";
import { safeFetch, type SafeFetchOptions } from "./safeFetch.js";
import type { UploadedAsset } from "./types.js";

export interface AssetPolicy {
  enabled: boolean;
  maxBytes?: number;
}

export interface CreateAssetRoutesOptions {
  assetStore: AssetStore;
  policy: (projectId: string) => Promise<AssetPolicy>;
  /** Prefix for `iri` on upload responses, e.g. `https://example.org/projects/p1/` */
  iriPrefix?: (projectId: string) => string;
  fetch?: SafeFetchOptions;
  defaultMaxBytes?: number;
  accept?: string[];
}

function pickThumbFormat(
  acceptHeader: string | undefined,
): "avif" | "webp" | "jpg" {
  const a = (acceptHeader ?? "").toLowerCase();
  if (a.includes("image/avif")) return "avif";
  if (a.includes("image/webp")) return "webp";
  return "jpg";
}

function assetResponse(asset: UploadedAsset, iriPrefix?: string) {
  const body: UploadedAsset & { iri?: string } = { ...asset };
  if (iriPrefix) {
    body.iri = `${iriPrefix.replace(/\/?$/, "/")}asset/${asset.assetId}`;
  }
  return body;
}

function requireProjectId(c: {
  req: { param: (name: string) => string | undefined };
}): string {
  const projectId = c.req.param("projectId");
  if (!projectId) throw new Error("missing route param projectId");
  return projectId;
}

export function createAssetRoutes(options: CreateAssetRoutesOptions): Hono {
  const app = new Hono();

  app.post("/", async (c) => {
    const projectId = requireProjectId(c);
    const pol = await options.policy(projectId);
    if (!pol.enabled) {
      return c.json({ error: "uploads disabled for project" }, 403);
    }

    const form = await c.req.parseBody();
    const file = form.file;
    if (!(file instanceof Blob)) {
      return c.json({ error: "multipart field `file` is required" }, 400);
    }

    const maxBytes =
      pol.maxBytes ?? options.defaultMaxBytes ?? options.fetch?.maxBytes;
    if (maxBytes != null && file.size > maxBytes) {
      return c.json({ error: `file exceeds maxBytes ${maxBytes}` }, 413);
    }
    try {
      const asset = await options.assetStore.ingest(projectId, {
        body: file,
        fileName: file instanceof File ? file.name : undefined,
        mediaType: file.type || undefined,
        dedupe: String(form.dedupe ?? "") === "true",
      });
      const prefix = options.iriPrefix?.(projectId);
      return c.json(assetResponse(asset, prefix), 201);
    } catch (err) {
      if (err instanceof AssetStoreError) {
        if (err.code === "too_large")
          return c.json({ error: err.message }, 413);
        if (err.code === "not_accepted")
          return c.json({ error: err.message }, 415);
      }
      throw err;
    }
  });

  app.post("/from-url", async (c) => {
    const projectId = requireProjectId(c);
    const pol = await options.policy(projectId);
    if (!pol.enabled) {
      return c.json({ error: "uploads disabled for project" }, 403);
    }

    let body: { url?: string; dedupe?: boolean };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid JSON body" }, 400);
    }
    if (!body.url) return c.json({ error: "`url` is required" }, 400);

    const maxBytes =
      pol.maxBytes ??
      options.defaultMaxBytes ??
      options.fetch?.maxBytes ??
      10 * 1024 * 1024;

    try {
      const fetched = await safeFetch(body.url, {
        ...options.fetch,
        maxBytes,
        accept: options.accept ?? options.fetch?.accept,
      });
      const asset = await options.assetStore.ingest(projectId, {
        body: fetched.bytes,
        mediaType: fetched.contentType ?? undefined,
        sourceUrl: fetched.finalUrl,
        dedupe: body.dedupe,
      });
      const prefix = options.iriPrefix?.(projectId);
      return c.json(assetResponse(asset, prefix), 201);
    } catch (err) {
      if (err instanceof SafeFetchError) {
        return c.json({ error: err.message, code: err.code }, 422);
      }
      if (err instanceof AssetStoreError) {
        if (err.code === "too_large")
          return c.json({ error: err.message }, 413);
        if (err.code === "not_accepted")
          return c.json({ error: err.message }, 415);
      }
      throw err;
    }
  });

  app.get("/:assetId", async (c) => {
    const projectId = requireProjectId(c);
    const assetId = c.req.param("assetId");
    const asset = await options.assetStore.get(projectId, assetId);
    if (!asset) return c.notFound();
    return c.json(asset);
  });

  app.get("/:assetId/original", async (c) => {
    const projectId = requireProjectId(c);
    const assetId = c.req.param("assetId");
    const opened = await options.assetStore.openOriginal(projectId, assetId);
    if (!opened) return c.notFound();
    const { asset, stream } = opened;
    c.header("Content-Type", asset.encodingFormat);
    c.header(
      "Content-Disposition",
      `inline; filename="${asset.fileName.replace(/"/g, "")}"`,
    );
    return c.body(stream);
  });

  app.get("/:assetId/thumb", async (c) => {
    const projectId = requireProjectId(c);
    const assetId = c.req.param("assetId");
    const opened = await options.assetStore.openOriginal(projectId, assetId);
    if (!opened) return c.notFound();
    const { asset } = opened;

    const isSvg = asset.encodingFormat === "image/svg+xml";
    const size = c.req.query("size") as
      | "chip"
      | "listItem"
      | "card"
      | "detail"
      | "full"
      | undefined;
    const w = c.req.query("w");
    const h = c.req.query("h");
    const dpr = c.req.query("dpr");
    const format = pickThumbFormat(c.req.header("Accept"));

    const signed = options.assetStore.thumbnailUrl(asset, {
      size,
      w: w ? Number(w) : undefined,
      h: h ? Number(h) : undefined,
      dpr: dpr ? Number(dpr) : undefined,
      format,
    });

    if (!signed || isSvg) {
      const fallback = await options.assetStore.openOriginal(
        projectId,
        assetId,
      );
      if (!fallback) return c.notFound();
      c.header("Content-Type", fallback.asset.encodingFormat);
      c.header("Cache-Control", "public, max-age=31536000, immutable");
      return c.body(fallback.stream);
    }

    const upstream = await fetch(signed);
    if (!upstream.ok || !upstream.body) {
      return c.json({ error: "thumbnail upstream failed" }, 502);
    }
    const ct = upstream.headers.get("content-type") ?? `image/${format}`;
    c.header("Content-Type", ct);
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.body(upstream.body);
  });

  return app;
}
