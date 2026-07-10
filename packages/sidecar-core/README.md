# @graviola/sidecar-core

Shared utilities for **scope-keyed companion documents** (Layer 1): fingerprint
binding, dangling-scope diagnostics, and payload-agnostic validation.

This package does **not** define a global `$schema`. Each orthogonal concern owns
its document type and schema IRI:

| Concern            | `$schema`                                  | Package                         |
| ------------------ | ------------------------------------------ | ------------------------------- |
| Calc profile       | `https://graviola.gra.one/calc-profile/v1` | `@graviola/formula-dependency`  |
| Meta profile       | `https://graviola.gra.one/meta/v1`         | `@graviola/meta-schema`         |
| UI / display hints | _(app-specific; no shared envelope)_       | JSON Forms + LinkML side-schema |

Calc profiles (and future lens sets) share the `{ appliesTo, slots }` envelope
validated here. UI schema and MetaSchema are orthogonal companions in the
architectural sense but use different document shapes.

## Calc-profile envelope (example)

```json
{
  "$schema": "https://graviola.gra.one/calc-profile/v1",
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
