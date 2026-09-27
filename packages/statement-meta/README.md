# @graviola/statement-meta

StatementSchema profiles, `$stmt` schema derivation, and document helpers (Layer 1).

## History retention

Statement history is retained in full by default. SPARQL stores can set
`statementMeta.retention` to `"latest"` or `{ keepLast: number }`, and can
override individual paths with `retentionByPath` keys such as `"Item.price"`.
The current statement always survives the configured cap.

Known limitation: statement nodes are deduplicated by value, so a value that
changes back (A → B → A) keeps one A node and one B node, even with the
default `"all"`. The trail shows both values but not that A returned.
