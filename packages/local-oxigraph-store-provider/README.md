# Local Oxigraph store provider

React provider wrapping an in-browser Oxigraph WASM store via `@graviola/sparql-db-impl`.

## Domain schema vs display schema

When entity-level metadata stamping is enabled (`metaStamping`), apps must pass **two**
schemas:

| Prop                                              | Purpose                                                                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `storeSchema` on `LocalOxigraphStoreProvider`     | **Domain** JSON Schema used for store init, write validation, and runtime meta grafting (`entityMeta` persistence key).                        |
| `schema` on `AdbProvider` (often `displaySchema`) | **Read/UI** schema — typically `deriveExtendedSchema(domain, metaProfile, { graftPropertyKey: "$meta" })` so loaded JSON keys match UI scopes. |

### Why

`initSPARQLStore` derives a persistence schema at runtime when `metaStamping` is set.
If the store root is already a pre-grafted extended schema **and** `makeStubSchema` runs
in the write pipeline, `cleanJSONLD` can strip `entityMeta` before INSERT — lifecycle
triples never reach Oxigraph.

**Contract:** store init uses the lean domain schema; UI reads use the extended schema.

### Example (testapp)

```tsx
<AdbProvider schema={itemExtendedSchema} ...>
  <LocalOxigraphStoreProvider
    storeSchema={itemJsonSchema}
    metaStamping={itemMetaStamping}
    ...
  />
</AdbProvider>
```

See also: Storybook **Library Docs → meta-schema → Store vs display schema**.
