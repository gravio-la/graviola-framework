# Milestone baseline (S1)

Recorded at milestone start on branch `feature/stratification-version-lens`.

| Check                                  | Result                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `bun run build:packages`               | 61/61 pass                                                                   |
| `apps/datastore-tests` (SKIP_PRISMA=1) | 63 pass, 0 fail                                                              |
| `apps/datastore-tests` (with Prisma)   | Prisma CLI unavailable in environment (status 127)                           |
| Generator pytest (nix develop)         | 59 pass                                                                      |
| testapp dist JS assets                 | 3,232,667 bytes (prior build; tsc currently fails on SnackbarProvider types) |

Concept book branch: `milestone/calc-meta-lenses` (primer+seed committed).
Generator branch: `feature/calc-profile`.
