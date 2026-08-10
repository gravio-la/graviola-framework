---
"@graviola/edb-import-staging": minor
---

Add canonicalizeChangeSet function for deterministic IRI canonicalization from staging change sets. Extracts local IDs from idAuthority, rewrites temp IRIs, and attaches sameAs. Includes optional coerceLiterals hook for domain-specific literal transformations (e.g., Wikidata string parsing).
