# Graviola REST Store — specification index

REST is **transport**, not a storage taxonomy: the logical contract is `@graviola/store-core` `Store<R>`; HTTP is how that contract crosses process boundaries.

This folder holds **normative wire documents**:

| Document                                                             | Role                                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [graviola-rest-wire-v1.md](./graviola-rest-wire-v1.md)               | Canonical **v1** REST-shaped wire contract                                         |
| [graviola-rest-wire-v0-legacy.md](./graviola-rest-wire-v0-legacy.md) | Descriptive **v0** contract matching legacy deployments (`initRestfullStore` URLs) |
| [graviola-rest-handshake.md](./graviola-rest-handshake.md)           | Discovery handshake (`/.well-known/graviola-store`)                                |

**OpenAPI** for v1 is a **generated artifact** (see `openapi/` and `scripts/generate-openapi.ts`), not the source of truth.

Client implementations:

- `RESTClientStore` — speaks **v1**
- `LegacyRESTClientStore` — speaks **v0**

Both expose the same `Store<R>` surface from TypeScript’s perspective; callers choose the client that matches their server.
