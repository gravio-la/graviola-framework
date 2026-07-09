# @graviola/sidecar-core

Generic **scope-keyed sidecar** document format for Graviola extensions.

Sidecars carry orthogonal concerns outside the domain JSON Schema. Known instances:

1. **UISchema** (rendering) — existing JSON Forms pattern, not migrated here
2. **MetaSchema** (administrative metadata) — `@graviola/meta-schema`
3. **Calc profile** (computation) — `@graviola/formula-dependency`

All dispatch identically: TBox **scope** on the outside, concern-specific payload on the inside.

## Document shape

```json
{
  "$schema": "https://graviola.top/sidecar/v1",
  "appliesTo": {
    "schema": "https://myapp/schema",
    "version": "1.2.0",
    "fingerprint": "sha256-…"
  },
  "slots": {
    "#/definitions/Person/properties/fullName": {}
  }
}
```

`appliesTo.fingerprint` is authoritative for drift detection; `version` is advisory for humans.
