# @graviola/asset-renderer

JSON Forms renderers for Graviola **asset classes** — single asset fields and asset galleries.

![Environment: Client](https://img.shields.io/badge/Environment-Client-blue)

## Overview

When a JSON Schema property (or array item) `$ref` points at a class listed in the app side-schema `assetClasses` map, these renderers take over instead of the generic linked-entity controls. They show thumbnails or file tiles, support upload and import flows through `AssetService`, and persist asset entities via the same CRUD hooks used elsewhere in forms.

Supported kinds per class name: `"image"` and `"file"`.

## Side schema

Asset dispatch is driven by **`assetClasses`** on the Graviola side schema (compiled into `AdbProvider` / JSON Forms `config.assetClasses` together with `config.registry`):

```json
{
  "assetClasses": {
    "Photo": "image",
    "Document": "file"
  }
}
```

The JSON Schema registry must include the referenced definitions (as with any linked type).

## Wiring `assetService`

Pass an `AssetService` implementation (for example from `@graviola/asset-client`) on your app provider:

```tsx
<AdbProvider
  assetService={createHttpAssetService({ baseUrl: "/api/assets", projectId: "demo" })}
  assetClasses={{ Photo: "image", Document: "file" }}
  /* … */
>
```

JSON Forms receives `config.assetService` from `SemanticJsonFormNoOps`. When `assetService.enabled` is `false`, fields stay read-only with a short hint; existing links can still be cleared.

## Exports

- `assetRenderers` — registry entries for `assetFieldTester` / `AssetFieldRenderer` and `assetGalleryTester` / `AssetGalleryRenderer`
- Individual testers and components for custom registries

`@graviola/graviola-app-config` adds `assetRenderers` to `defaultRenderers` automatically.

## Installation

```bash
bun add @graviola/asset-renderer
```

Peer dependencies: `@jsonforms/*`, `@mui/material`, `@graviola/edb-state-hooks`, `react`.
