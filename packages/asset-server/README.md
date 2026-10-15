# @graviola/asset-server

Server-side asset storage on the local filesystem, optional [Picturium](https://github.com/gravio-la/picturium) thumbnail URLs (HMAC-signed), and a mountable Hono sub-app for uploads and delivery.

## What it provides

- **`FsStorageAdapter`** — write/read/delete blobs under a `rootDir` with safe relative keys (`<projectId>/<assetId>.<ext>`).
- **`createAssetStore`** — ingest with MIME sniffing, SHA-256, optional per-project dedupe index, sidecar JSON metadata, and signed thumbnail URL builders.
- **`safeFetch`** — SSRF-hardened HTTP(S) fetch for `POST /from-url` (DNS-checked, redirect-validated, size-capped).
- **`createAssetRoutes`** — Hono routes for multipart upload, URL ingest, metadata, original bytes, and thumbnail proxying.

## Mounting the HTTP API

Mount the returned app at `/api/projects/:projectId/assets`. The parent app must expose the `projectId` route param; reads work even when upload policy is disabled.

```ts
import { Hono } from "hono";
import {
  FsStorageAdapter,
  createAssetStore,
  createAssetRoutes,
} from "@graviola/asset-server";

const storage = FsStorageAdapter({ rootDir: process.env.ASSET_ROOT! });
const assetStore = createAssetStore({
  storage,
  maxBytes: 25 * 1024 * 1024,
  accept: ["image/*", "application/pdf"],
  picturium: {
    baseUrl: process.env.PICTURIUM_BASE_URL!,
    key: process.env.PICTURIUM_KEY!,
    dataDir: process.env.PICTURIUM_DATA_DIR ?? process.env.ASSET_ROOT!,
  },
});

const app = new Hono();
app.route(
  "/api/projects/:projectId/assets",
  createAssetRoutes({
    assetStore,
    policy: async (projectId) => ({ enabled: true }),
    iriPrefix: (projectId) => `https://example.org/projects/${projectId}/`,
  }),
);
```

## Configuration

| Variable / option                         | Role                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `ASSET_ROOT` / `FsStorageAdapter.rootDir` | Filesystem root shared with Picturium `DATA_DIR` when thumbnailing          |
| `PICTURIUM_BASE_URL`                      | Public base URL of the Picturium server (no trailing slash required)        |
| `PICTURIUM_KEY`                           | HMAC secret (`KEY` in Picturium `.env`)                                     |
| `PICTURIUM_DATA_DIR`                      | Same path Picturium uses as its data directory (for signing relative paths) |

## Picturium signing

Tokens must match Picturium’s verifier: HMAC-SHA256 over `{rawPath}?{sorted query without token}`, where `rawPath` is the absolute file path relative to `DATA_DIR` (not URL-encoded). Query strings in the signed URL percent-encode keys and values with the same rules as Rust `NON_ALPHANUMERIC`. SVG originals are never sent through Picturium for thumbs; the thumb route serves the stored file instead.

## License

MIT
