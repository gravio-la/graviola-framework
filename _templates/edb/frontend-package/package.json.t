---
to: packages/<%= name.split("/")[1] %>/package.json
---
{
  "name": "<%= name %>",
  "version": "1.0.0",
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
    "CHANGELOG.md",
    "README.md"
  ],
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
    "@mui/material": "^5",
    "@mui/icons-material": "^5",
    "react": "^18"
  },
  "dependencies": {
  },
  "devDependencies": {
    "@graviola/edb-tsconfig": "workspace:*",
    "@graviola/edb-tsup-config": "workspace:*",
    "eslint-config-edb": "workspace:*",
    "tsup": "^8.0.0"
  },
  "eslintConfig": {
    "root": true,
    "extends": ["eslint-config-edb"]
  }
}

