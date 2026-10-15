import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import type { AssetStore } from "./assetStore.js";
import {
  contentDispositionHeader,
  isInlineOriginalMime,
  SECURE_CONTENT_HEADERS,
} from "./contentDisposition.js";
import { AssetStoreError, SafeFetchError } from "./errors.js";
import { safeFetch, type SafeFetchOptions } from "./safeFetch.js";
import { parseThumbQuery } from "./thumbParams.js";
import type { UploadedAsset } from "./types.js";
import { assertValidProjectId } from "./validateIds.js";

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

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
/** Extra bytes for multipart boundaries and field names. */
const MULTIPART_OVERHEAD = 64 * 1024;

function assetResponse(asset: UploadedAsset, iriPrefix?: string) {
  const body: UploadedAsset & { iri?: string } = { ...asset };
  if (iriPrefix) {
    body.iri = `${iriPrefix.replace(/\/?$/, "/")}asset/${asset.assetId}`;
  }
  return body;
}

function mapStoreError(err: AssetStoreError): Response {
  if (err.code === "invalid_id") {
    return Response.json({ error: err.message }, { status: 400 });
  }
  if (err.code === "too_large") {
    return Response.json({ error: err.message }, { status: 413 });
  }
  if (err.code === "not_accepted") {
    return Response.json({ error: err.message }, { status: 415 });
  }
  throw err;
}

function applySecureDeliveryHeaders(c: {
  header: (name: string, value: string) => void;
}) {
  for (const [k, v] of Object.entries(SECURE_CONTENT_HEADERS)) {
    c.header(k, v);
  }
}

function requireProjectId(c: {
  req: { param: (name: string) => string | undefined };
}): string {
  const projectId = c.req.param("projectId");
  if (!projectId) throw new Error("missing route param projectId");
  assertValidProjectId(projectId);
  return projectId;
}

async function bodyLimitForProject(
  options: CreateAssetRoutesOptions,
  projectId: string,
): Promise<number> {
  const pol = await options.policy(projectId);
  return (
    (pol.maxBytes ?? options.defaultMaxBytes ?? DEFAULT_MAX_BYTES) +
    MULTIPART_OVERHEAD
  );
}

export function createAssetRoutes(options: CreateAssetRoutesOptions): Hono {
  const app = new Hono();

  app.post("/", async (c, next) => {
    let projectId: string;
    try {
      projectId = requireProjectId(c);
    } catch (err) {
      if (err instanceof AssetStoreError) return mapStoreError(err);
      throw err;
    }
    const limit = await bodyLimitForProject(options, projectId);
    return bodyLimit({
      maxSize: limit,
      onError: (ctx) => ctx.json({ error: "payload too large" }, 413),
    })(c, next);
  });

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
      pol.maxBytes ?? options.defaultMaxBytes ?? DEFAULT_MAX_BYTES;
    if (file.size > maxBytes) {
      return c.json({ error: `file exceeds maxBytes ${maxBytes}` }, 413);
    }
    const dedupeField = form.dedupe;
    const dedupe =
      dedupeField == null || dedupeField === ""
        ? true
        : String(dedupeField) === "true";
    try {
      const asset = await options.assetStore.ingest(projectId, {
        body: file,
        fileName: file instanceof File ? file.name : undefined,
        mediaType: file.type || undefined,
        dedupe,
      });
      const prefix = options.iriPrefix?.(projectId);
      return c.json(assetResponse(asset, prefix), 201);
    } catch (err) {
      if (err instanceof AssetStoreError) return mapStoreError(err);
      throw err;
    }
  });

  app.post("/from-url", async (c, next) => {
    let projectId: string;
    try {
      projectId = requireProjectId(c);
    } catch (err) {
      if (err instanceof AssetStoreError) return mapStoreError(err);
      throw err;
    }
    const limit = await bodyLimitForProject(options, projectId);
    return bodyLimit({
      maxSize: limit + 4096,
      onError: (ctx) => ctx.json({ error: "payload too large" }, 413),
    })(c, next);
  });

  app.post("/from-url", async (c) => {
    const projectId = requireProjectId(c);
    const pol = await options.policy(projectId);
    if (!pol.enabled) {
      return c.json({ error: "uploads disabled for project" }, 403);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid JSON body" }, 400);
    }
    if (!body || typeof body !== "object") {
      return c.json({ error: "invalid JSON body" }, 400);
    }
    const record = body as { url?: unknown; dedupe?: unknown };
    if (typeof record.url !== "string" || !record.url) {
      return c.json({ error: "`url` is required" }, 400);
    }
    if (record.dedupe != null && typeof record.dedupe !== "boolean") {
      return c.json({ error: "`dedupe` must be a boolean" }, 400);
    }
    const dedupe = record.dedupe !== false;

    const maxBytes =
      pol.maxBytes ??
      options.defaultMaxBytes ??
      options.fetch?.maxBytes ??
      DEFAULT_MAX_BYTES;

    try {
      const fetched = await safeFetch(record.url, {
        ...options.fetch,
        maxBytes,
        accept: options.accept ?? options.fetch?.accept,
      });
      const asset = await options.assetStore.ingest(projectId, {
        body: fetched.bytes,
        mediaType: fetched.contentType ?? undefined,
        sourceUrl: fetched.finalUrl,
        dedupe,
      });
      const prefix = options.iriPrefix?.(projectId);
      return c.json(assetResponse(asset, prefix), 201);
    } catch (err) {
      if (err instanceof SafeFetchError) {
        return c.json({ error: err.message, code: err.code }, 422);
      }
      if (err instanceof AssetStoreError) return mapStoreError(err);
      throw err;
    }
  });

  app.get("/:assetId", async (c) => {
    try {
      const projectId = requireProjectId(c);
      const asset = await options.assetStore.get(
        projectId,
        c.req.param("assetId") ?? "",
      );
      if (!asset) return c.notFound();
      return c.json(asset);
    } catch (err) {
      if (err instanceof AssetStoreError) {
        if (err.code === "invalid_id") return mapStoreError(err);
      }
      throw err;
    }
  });

  app.get("/:assetId/original", async (c) => {
    try {
      const projectId = requireProjectId(c);
      const opened = await options.assetStore.openOriginal(
        projectId,
        c.req.param("assetId") ?? "",
      );
      if (!opened) return c.notFound();
      const { asset, stream } = opened;
      applySecureDeliveryHeaders(c);
      c.header("Content-Type", asset.encodingFormat);
      c.header(
        "Content-Disposition",
        contentDispositionHeader(
          asset.fileName,
          isInlineOriginalMime(asset.encodingFormat),
        ),
      );
      return c.body(stream);
    } catch (err) {
      if (err instanceof AssetStoreError && err.code === "invalid_id") {
        return mapStoreError(err);
      }
      throw err;
    }
  });

  app.get("/:assetId/thumb", async (c) => {
    try {
      const projectId = requireProjectId(c);
      const assetId = c.req.param("assetId") ?? "";
      let thumbParams;
      try {
        thumbParams = parseThumbQuery({
          size: c.req.query("size") ?? "",
          w: c.req.query("w") ?? "",
          h: c.req.query("h") ?? "",
          dpr: c.req.query("dpr") ?? "",
        });
      } catch (err) {
        return c.json(
          {
            error: err instanceof Error ? err.message : "invalid thumb params",
          },
          400,
        );
      }

      const opened = await options.assetStore.openOriginal(projectId, assetId);
      if (!opened) return c.notFound();
      const { asset } = opened;

      const isSvg = asset.encodingFormat === "image/svg+xml";
      const signed = options.assetStore.thumbnailUrl(asset, thumbParams);

      if (!signed || isSvg) {
        const fallback = await options.assetStore.openOriginal(
          projectId,
          assetId,
        );
        if (!fallback) return c.notFound();
        applySecureDeliveryHeaders(c);
        c.header("Content-Type", fallback.asset.encodingFormat);
        c.header("Cache-Control", "public, max-age=31536000, immutable");
        c.header(
          "Content-Disposition",
          contentDispositionHeader(
            fallback.asset.fileName,
            isInlineOriginalMime(fallback.asset.encodingFormat),
          ),
        );
        return c.body(fallback.stream);
      }

      const accept = c.req.header("Accept") ?? "image/*";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      let upstream: Response;
      try {
        upstream = await fetch(signed, {
          headers: { Accept: accept },
          signal: controller.signal,
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return c.json({ error: "thumbnail upstream timeout" }, 504);
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }

      if (!upstream.ok || !upstream.body) {
        return c.json({ error: "thumbnail upstream failed" }, 502);
      }
      const ct = upstream.headers.get("content-type") ?? "image/jpeg";
      applySecureDeliveryHeaders(c);
      c.header("Content-Type", ct);
      c.header("Cache-Control", "public, max-age=31536000, immutable");
      c.header("Vary", "Accept");
      return c.body(upstream.body);
    } catch (err) {
      if (err instanceof AssetStoreError && err.code === "invalid_id") {
        return mapStoreError(err);
      }
      throw err;
    }
  });

  return app;
}
