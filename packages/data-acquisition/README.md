# `@graviola/data-acquisition`

Declarative data-source acquisition: fetch, cache, retry, rate-limit, and provenance.

Descriptors (`DataSource`) describe _how_ to fetch; merging and conflict resolution stay in application code and consume typed `Evidence`.

## Overpass `fallback`

`OverpassSource.fallback` is the one place logic is smuggled into a descriptor — reserved for `map_to_area` → bbox escalation only. If a third case appears, move it to application code.
