# `@graviola/edb-detail-renderer`

MUI + React bindings for semantic **detail views** on top of `@graviola/edb-detail-renderer-core`.

Provides the ready-to-use `<DetailRenderer>` component, default MUI layout/control renderers, and chip renderers for linked entities/media.

## What this package adds

- `<DetailRenderer>` root component with context (`useDetailRendererContext`)
- default renderer registry (layouts + controls) using JSON Forms tester ranking
- `TopLevelLayout` card/header rendering (label/description/image preview)
- chip helpers and defaults (`defaultChipsConfig`, `EntitySummaryChip`)
- re-exports of core utilities/types for convenience

## Override paths

1. **Renderer rank** — `config.extraRenderers` / `config.overrideRenderers`
2. **Per-type config** — `typeNameOverrides` / `typeIRIOverrides`
3. **UISchema roots** — `uiSchemata` / `uiSchemataByTypeIRI`
4. **Property visibility defaults** — `hideLinkedDataProperties`, `hideHeaderPrimaryFields`, `hiddenPropertyNames`, `alwaysShowPropertyNames`

## Example: custom price renderer

Add a name-based tester with higher rank and inject it via `extraRenderers`:

```ts
const customPriceRenderer = {
  tester: rankWith(9, isPriceByName),
  renderer: PriceCentsRenderer,
};

<DetailRenderer
  schema={schema}
  data={data}
  config={{ extraRenderers: [customPriceRenderer] }}
/>;
```

## Related packages

- `@graviola/edb-detail-renderer-core` — headless dispatch/tester/config logic (no MUI)
