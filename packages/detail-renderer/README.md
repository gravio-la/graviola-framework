# `@graviola/edb-detail-renderer`

**Graviola role:** flesh · ready-to-use MUI `DetailRenderer` for semantic entity views

MUI + React bindings for semantic **detail views** and compact view sizes (`chip`, `listItem`, `card`, `detail`) on top of `@graviola/edb-detail-renderer-core`.

Provides the ready-to-use `<DetailRenderer>` component, default MUI layout/control renderers, and `CardLayoutRenderer` for Material 3 gallery cards.

## What this package adds

- `<DetailRenderer>` root component with context (`useDetailRendererContext`)
- default renderer registry (layouts + controls) using JSON Forms tester ranking
- `TopLevelLayout` card/header rendering (label/description/image preview)
- **`CardLayoutRenderer`** — M3 cards (elevated / filled / outlined, media overlay, stats strip, actions, expandable)
- `MotionAdapter` seam for shared-element transitions (no hard dependency on motion/framer)
- re-exports of core utilities/types for convenience

## Card presentation (`cardPresentation`)

Configure per type on `AdbProvider.cardPresentation` or `viewConfig.card.options`:

| Option             | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `secondaryFields`  | Leaf properties shown in the card body       |
| `secondaryDisplay` | `inline` or `stats` (profile-style strip)    |
| `actions`          | M3 action row (`show` / `edit` / `custom`)   |
| `variant`          | `elevated` · `filled` · `outlined`           |
| `orientation`      | `vertical` · `horizontal`                    |
| `size`             | `compact` · `standard` · `comfortable`       |
| `expandable`       | In-place expand (distinct from detail modal) |
| `mediaOverlay`     | Headline over hero image with scrim          |
| `banner`           | Profile-card banner property                 |

Default UISchema: `generateDefaultCardUISchema` → `CardLayout` with ranked secondary controls.

## Override paths

1. **Renderer rank** — `config.extraRenderers` / `config.overrideRenderers`
2. **Per-type config** — `typeNameOverrides` / `typeIRIOverrides`
3. **UISchema roots** — `uiSchemata` / `uiSchemataByTypeIRI`
4. **Property visibility defaults** — `hideLinkedDataProperties`, `hideHeaderPrimaryFields`, `hiddenPropertyNames`, `alwaysShowPropertyNames`
5. **Whole card** — replace `CardLayout` via `viewConfig.card.overrideRenderers` or `SemanticCardSlotProvider`

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
- `@graviola/semantic-views` — `SemanticCard` public API
