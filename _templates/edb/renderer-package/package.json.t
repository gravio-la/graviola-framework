---
to: packages/form-renderer/<%= name.split("/")[1] %>/package.json
---
{
  "name": "<%= name %>",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "CHANGELOG.md"
  ],
  "sideEffects": false,
  "scripts": {
    "depcheck": "depcheck",
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src/**/*.{ts,tsx}",
    "lint-fix": "eslint --fix src/**/*.{ts,tsx}",
    "pack-tarball": "bun pm pack",
    "release": "bun publish --access public"
  },
  "peerDependencies": {
    "@graviola/edb-state-hooks": "workspace:*",
    "@mui/material": "^5",
    "@mui/icons-material": "^5",
    "@jsonforms/material-renderers": "^3",
    "@jsonforms/core": "^3",
    "@jsonforms/react": "^3",
    "react": "^18"
  },
  "dependencies": {
    "@graviola/edb-core-utils": "workspace:*",
    "next-i18next": "^15",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "@types/react": "~18.3",
    "@types/lodash-es": "^4.17.12",
    "@storybook/react": "^8.1.5",
    "@jsonforms/core": "^3",
    "@jsonforms/react": "^3",
    "@graviola/edb-tsconfig": "workspace:*",
    "@graviola/edb-tsup-config": "workspace:*",
    "eslint-config-edb": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.8.2"
  },
  "eslintConfig": {
    "root": true,
    "extends": [
      "eslint-config-edb"
    ]
  }
}
