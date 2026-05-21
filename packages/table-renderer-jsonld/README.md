# `@graviola/edb-table-renderer-jsonld`

**Graviola role:** tissue · column registry for JSON-LD document rows

**Tissue** package — `TableColumnRegistry` for rows that are plain JSON-LD documents (depth ≤ 2), as returned by `filterTypedDocuments` from a `Store`.

Exports `jsonLdColumnRegistry`, a ranked tester/renderer array covering:

| name                       | matches                                           |
| -------------------------- | ------------------------------------------------- |
| `jsonld:date`              | `format: "date"` / `"date-time"`                  |
| `jsonld:enum`              | `enum` / `oneOf`                                  |
| `jsonld:boolean`           | `type: "boolean"`                                 |
| `jsonld:primitive`         | `string` / `number` / `integer`                   |
| `jsonld:nested-chip-array` | `type: "array"`                                   |
| `jsonld:nested-chip`       | `$ref` or `type: "object"`                        |
| `jsonld:fallback-omit`     | everything else (rank 0, produces empty fragment) |

`mkJsonLdAccessor(scope)` converts a JSON Schema scope pointer (`#/properties/birth/properties/date`) to a lodash `get` path, used by all built-in renderers.

The registry is consumed by `SemanticTable` when `rowShape="jsonld"`.

## Extension

```ts
import {
  jsonLdColumnRegistry,
  mkJsonLdAccessor,
} from "@graviola/edb-table-renderer-jsonld";

const myEntry = {
  name: "jsonld:money",
  tester: (schema) => (schema.format === "currency" ? 5 : -1),
  renderer: ({ scope, column }) => ({
    id: scope,
    header: column?.label,
    accessorFn: mkJsonLdAccessor(scope),
    Cell: ({ cell }) => `€ ${cell.getValue()}`,
  }),
};
```

## Related packages

- `@graviola/edb-table-types` — spine; defines the registry contract
- `@graviola/edb-table-renderer-sparql-select` — parallel registry for SPARQL SELECT rows
- `@graviola/edb-table-components` — integrates both registries into `SemanticTable`
