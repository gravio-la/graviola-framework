---
"@graviola/sparql-schema": patch
"@graviola/sparql-db-impl": patch
---

fix(sparql-schema): never expand the DELETE template of `save`/`remove` into linked named entities

`jsonSchema2construct` builds the DELETE side of the DELETE/INSERT issued on every save. Its only
recursion boundary was the TBox stop symbol `@id`; schema artifacts that omit `@id` on referenced
definitions (e.g. LinkML-generated models without identifier slots) made the template expand up to
four levels into linked IRIs and wipe them (`Location.parent` → parent, grand-parent … lost all
triples on each save; `Place.location` / `Place.parent` overwrote each other's targets).

Every nested expansion is now additionally anchored in its own
`OPTIONAL { <link> FILTER(isBlank(?o)) … }` group — the Concise Bounded Description proper: only
anonymous (blank-node) sub-objects owned by the subject are ever expanded; IRIs are never followed
regardless of the schema. Link triples are still matched on their own so stale references are removed.
Nested patterns are all OPTIONAL (deletion wants maximal matching), which also fixes stale links that
survived when a linked target lacked a schema-`required` property.

Adds an in-process Oxigraph contract suite (`apps/datastore-tests/src/cbd-boundary.test.ts`) covering
both schema shapes (with and without `@id`).
