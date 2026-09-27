---
"@graviola/edb-core-types": minor
---

edb-core-types: changes since 1.7.0 plus the wave-1 review cleanup.

- New since 1.7.0: entity actions and host capabilities (`EntityActionDef`, `HostCapabilities`, …) replace the card actions (`CardActionIntent`/`CardActionDef` were removed). Also new: thumbnail and preview types, `SparqlFeatureFlags` / `ResolvedSparqlFeatureFlags`, an extended `SPARQLFlavour`, and the structural `IconComponentLike`.
- Presentation and entity-action types now live in their own modules (`presentation.ts`, `entityActions.ts`). Import paths are unchanged.
- Removed the unused app-settings types (`Settings`, `Features`, `OpenAIConfig`, `GoogleDriveConfig`, `ExternalAuthorityConfig`, `UseLocalSettings`), including a stale second `SparqlEndpoint` declaration.
- Removed unused types: `WhereOperators` (deprecated), `BasicThingInformation`, `NamespaceBuilderPrefixes`, `ResultBindings`, `Permission`, `PermissionDeclaration`. Dropped the `@rdfjs/namespace` dependency.
