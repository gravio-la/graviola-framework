# @graviola/store-core

The storage contract of Graviola: a store is a `BaseStore` plus the capabilities it actually implements, with typed reads, change events, and small simulators that derive one capability from another.

![Layer: 1 (Foundation)](https://img.shields.io/badge/Layer-1%20Foundation-blue)
![Environment: Universal](https://img.shields.io/badge/Environment-Browser%20%2B%20Bun%20%2B%20Node-green)

## Why this package exists

A Graviola store is composed from **capabilities** (`Loads`, `Lists`, `Filters`, `Searches`, `Writes`, `Removes`, `Counts`, `Aggregates`, `Statements`, `DocumentSearches`, `Calc`, …). A backend declares exactly what it can do, and callers check it with `hasCapability` before they use it. A read-only file and a full SPARQL endpoint share the same identity and load surface without pretending to be the same CRUD interface.

This package is the successor of `AbstractDatastore` in `@graviola/edb-global-types`, which is deprecated.

## Position in the framework

The package is in **Layer 1 (Foundation)**. It is types plus a tiny runtime, and it has no React. It depends only on `@graviola/edb-core-types`, `@graviola/provenance-types`, and `@graviola/typed-query-types`. It runs unchanged in the browser, in Bun, and in Node. Adding React, MUI, or any browser-only dependency here is a breaking change for server-side users, even if no test fails.

| Role            | Packages                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| Implementations | `sparql-db-impl`, `prisma-db-impl`, `rest-store-client`, `meilisearch-sparql-store`, `fulltext-search-core` |
| Composition     | `store-factory`                                                                                             |
| Consumers       | `edb-state-hooks`, the table and facet components, `rest-store-server`, `rest-server-hono`                  |

## Key concepts

- **`SchemaRegistry` and `EntityOf`.** A registry maps logical type names (`"Person"`) to entity shapes. `EntityOf<R, "Person">` is that shape. Typing a store as `BaseStore<R> & Loads<R>` makes `loadOne("Person", iri)` return the registered entity.
- **Capability descriptor and profiles.** `CapabilityDescriptor` is the runtime mirror of which capabilities a store implements. `hasCapability` narrows the store type after a check; `hasCapabilityInDescriptor` does the same check against handshake metadata before a store exists. `profiles` carries routing detail (search mode, count cost, write atomicity, statement encoding, SPARQL feature flags). `speaksLanguage` asks whether a native-query store advertises a language such as `"sparql"`.
- **`ReadResult` envelopes and freshness.** `loadOne(typeName, iri, { withMeta: true })` returns a `ReadResult<T>`: the entity plus provenance (`sources`, `fetchedAt`, `freshness` of `"fresh" | "stale" | "unknown"`), and optional completeness and cost.
- **Change events.** `createChangeBus<R>()` is a small pub/sub. Listeners receive an `EntityChangeEvent<R>`: `"upsert"` (optional typed `data`) or `"remove"` (no document). `BaseStore.subscribe` is the same listener shape when the store emits its own events.
- **Simulators.** `createExistsFromLoads` and `createResolvesFromLoads` derive the cheaper `Exists` and `Resolves` capabilities from `Loads`, so a backend does not have to implement them natively.
- **Composition presets.** `SparqlStore<R>` is the full read/write intersection used by SPARQL backends. `MinimalLookupStore<R>` is load plus search. `ReadOnlyStructuralStore<R>` is structural read access without `Writes` or `Removes`.

## Installation

```bash
bun add @graviola/store-core
# or
npm install @graviola/store-core
```

## Usage

```ts
import { createChangeBus, hasCapability } from "@graviola/store-core";
import type { BaseStore, Loads } from "@graviola/store-core";

type AppRegistry = {
  Person: { "@id": string; name: string };
};

async function loadPerson(
  store: BaseStore<AppRegistry> & Loads<AppRegistry>,
  iri: string,
): Promise<{ name: string; total: number | null } | null> {
  const person = await store.loadOne("Person", iri);
  if (!person) return null;

  const total = hasCapability(store, "counts")
    ? await store.count("Person")
    : null;

  return { name: person.name, total };
}

const changes = createChangeBus<AppRegistry>();
changes.subscribe((event) => {
  if (event.changeType === "upsert" && event.typeName === "Person") {
    console.log(event.entityIRI, event.data?.name);
  }
});
```

## API reference

The full list of exports is in the generated TypeDoc API documentation (`bun run docs` at the repository root). Every export has a doc comment in `src/`.

## License

MIT
