# eslint-config-edb

## 0.1.4

### Minor Changes

- Add opt-in **`eslint-config-edb/strict`** (`strict.js`): extends the baseline config with `@typescript-eslint/consistent-type-definitions` (prefer `type`), `func-style` / `prefer-arrow-callback`, and `no-restricted-syntax` rules that disallow classes except `extends Error` (built-ins allowed via selector).
- Declare **`exports`** for `"."` and `"./strict"` so `extends: ["eslint-config-edb/strict"]` resolves reliably.

### Patch Changes

- Depend on **`@typescript-eslint/eslint-plugin`** for rules used in the strict preset.
- Drop the baseline ESLint **`semi`** rule (formatting is left to Prettier; avoids duplicate enforcement).

**Adopting the strict preset in a package:** set `eslintConfig.extends` to `["eslint-config-edb/strict"]` (see `@graviola/rest-store-client`). Other packages can stay on `eslint-config-edb` until you migrate them.

## 0.1.2

### Patch Changes

- make workspace depenedncies peer depenedncies

## 0.1.1

### Patch Changes

- massive refactoring due to separation of dependencies in order to publish the library for universal reuse

## 0.1.0

### Minor Changes

- stabilizing interfaces and make UX and Design improvements in all areas, translation and behavioral adaptation
