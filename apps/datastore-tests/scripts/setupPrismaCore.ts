/**
 * Shared Prisma setup: write schema, generate client, db push.
 * Used by `setup-prisma.ts` (optional `bun run setup:prisma`) and each Prisma adapter `setup()` before
 * connecting — the generated client must match the datasource provider (sqlite vs mysql, …).
 *
 * On NixOS, `nix develop .#prisma6` sets `PRISMA_*` to nixpkgs engines (no downloadable `linux-nixos`
 * binaries in npm). The workspace `prisma` / `@prisma/client` versions must match that CLI (see root
 * `catalogs.prisma` — align with `prisma version` inside the flake shell). Invokes `prisma` on PATH
 * so the same CLI talks to those engines; `process.env` is passed through unchanged.
 * Step-by-step: bump catalog → `bun install` at repo root → `nix develop .#prisma6` or `nix develop -c '…'`
 * (see `apps/datastore-tests/README.md`).
 *
 * **Prisma 6 vs 7:** detected from the installed `prisma` package. v6 keeps `url = env("DATABASE_URL")`
 * in `schema.prisma` and removes `prisma.config.ts`. v7 omits the URL from the schema and writes
 * `prisma.config.ts` with `defineConfig` / `env("DATABASE_URL")` (Prisma 7+ CLI).
 */
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { createRequire } from "node:module";
import { join } from "path";
import {
  composeMetaSchemaProfile,
  deriveExtendedSchema,
  ENTITY_META_PERSISTENCE_KEY,
} from "@graviola/meta-schema";
import {
  graviolaStatementsModelText,
  jsonSchema2PrismaWithManifest,
} from "@graviola/json-schema-prisma-utils";
import {
  entityIdentityFromIdKey,
  PRISMA_SCHEMA_IDENTITY,
} from "@graviola/json-schema-utils";
import { gardenFeeSchema } from "@graviola/calc-fixtures";
import { rawTestSchema } from "../src/schema/testSchema";
import type { JSONSchema7 } from "json-schema";

/**
 * Contract-test persistence schema: the Item/Tag/Category test domain plus the
 * garden-fee calc fixture domain (Plot/Patch/Garden), so Prisma adapters can
 * expose a `calcStore` for the real-store calc-engine suite.
 */
export const contractPersistenceSchema = {
  ...(rawTestSchema as unknown as JSONSchema7),
  definitions: {
    ...(rawTestSchema as { definitions: Record<string, unknown> }).definitions,
    ...(gardenFeeSchema as { definitions?: Record<string, unknown> })
      .definitions,
  },
} as JSONSchema7;

export type PrismaProvider = "sqlite" | "postgresql" | "mysql" | "mongodb";

/**
 * Post-process generated Prisma models: framework inline `entityMeta` lifecycle
 * columns get `@default(now())` / `@updatedAt`. Store/build config only — no JSON Schema extensions.
 */
export function applyFrameworkNativeLifecycleColumns(
  prismaModels: string,
  persistenceKey: string = ENTITY_META_PERSISTENCE_KEY,
): string {
  const created = `${persistenceKey}_created`;
  const modified = `${persistenceKey}_modified`;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return prismaModels
    .replace(
      new RegExp(`^(\\s*)${esc(created)}\\s+DateTime\\??$`, "gm"),
      `$1${created} DateTime @default(now())`,
    )
    .replace(
      new RegExp(`^(\\s*)${esc(modified)}\\s+DateTime\\??$`, "gm"),
      `$1${modified} DateTime @updatedAt`,
    );
}

/** Derive Prisma `datasource provider` from a connection URL (not from env). */
export function databaseUrlToProvider(url: string): PrismaProvider {
  const u = url.trim();
  if (u.startsWith("file:") || u.startsWith("sqlite:")) return "sqlite";
  if (u.startsWith("postgresql:") || u.startsWith("postgres:"))
    return "postgresql";
  if (u.startsWith("mysql:") || u.startsWith("mariadb:")) return "mysql";
  if (u.startsWith("mongodb:") || u.startsWith("mongodb+srv:"))
    return "mongodb";
  throw new Error(
    `Unknown Prisma DATABASE_URL scheme (expected file:, postgres:, mysql:, …): ${u.slice(0, 64)}`,
  );
}

const require = createRequire(import.meta.url);

export type PrismaCliMajor = 6 | 7;

/** Resolve installed Prisma CLI major from `prisma` in node_modules (datastore-tests or hoisted). */
export function getInstalledPrismaMajorVersion(): PrismaCliMajor {
  try {
    const pkgPath = require.resolve("prisma/package.json", {
      paths: [join(import.meta.dir, "..")],
    });
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      version: string;
    };
    const major = Number.parseInt(pkg.version.split(".")[0] ?? "6", 10);
    return major >= 7 ? 7 : 6;
  } catch {
    return 6;
  }
}

/** Fresh SQLite file DB for tests: delete files so we can use `db push` without `--force-reset` */
function removeSqliteDatabaseFiles(databaseUrl: string, appRoot: string): void {
  const raw = databaseUrl.trim();
  const pathPart = raw.startsWith("file:")
    ? raw.slice("file:".length)
    : raw.replace(/^sqlite:/, "");
  const rel = pathPart.replace(/^\.\//, "");
  const dbPath = join(appRoot, rel);
  if (existsSync(dbPath)) rmSync(dbPath);
  for (const suff of ["-journal", "-wal", "-shm"] as const) {
    const f = dbPath + suff;
    if (existsSync(f)) rmSync(f);
  }
}

/** Drop cached @prisma/client so the next import() loads the newly generated client. */
export function invalidateGeneratedPrismaClientCache(): void {
  for (const k of Object.keys(require.cache)) {
    if (k.includes("@prisma/client") || k.includes(".prisma/client")) {
      delete require.cache[k];
    }
  }
}

/**
 * Map JSON-LD `@id`/`@type` on every definition to Prisma `id`/`type` without
 * duplicating fields (jsonSchema2Prisma would otherwise emit `id` twice).
 */
export function jsonLdSchemaToPrismaIdentity(schema: JSONSchema7): JSONSchema7 {
  const definitions = (schema.definitions ?? schema.$defs) as
    | Record<string, JSONSchema7>
    | undefined;
  if (!definitions) return schema;

  const nextDefs: Record<string, JSONSchema7> = {};
  for (const [name, def] of Object.entries(definitions)) {
    if (typeof def !== "object" || def === null) continue;
    const props = { ...(def.properties as Record<string, JSONSchema7>) };
    if (props["@id"]) {
      props.id = props["@id"];
      delete props["@id"];
    }
    if (props["@type"]) {
      props.type = props["@type"];
      delete props["@type"];
    }
    if (!props.id) props.id = { type: "string" };
    if (!props.type) props.type = { type: "string" };
    const required = (def.required as string[] | undefined)?.map((k) =>
      k === "@id" ? "id" : k === "@type" ? "type" : k,
    );
    const req = new Set(required ?? []);
    req.add("id");
    req.add("type");
    nextDefs[name] = {
      ...def,
      properties: props,
      required: [...req],
    };
  }
  return { ...schema, definitions: nextDefs };
}

/**
 * Regenerate prisma/schema.prisma for `databaseUrl`, run `prisma generate` + `db push`.
 * Synchronous; throws on failure.
 */
export function runPrismaSetupForUrl(databaseUrl: string): void {
  const provider = databaseUrlToProvider(databaseUrl);

  console.log(`[setup-prisma] Generating schema for provider: ${provider}`);
  console.log(`[setup-prisma] Database URL: ${databaseUrl}`);

  const extendedSchema = jsonLdSchemaToPrismaIdentity(
    contractPersistenceSchema,
  );
  const persistenceSchema = deriveExtendedSchema(
    extendedSchema,
    composeMetaSchemaProfile({ includeLifecycle: true }),
    {
      inlineMetaSchema: true,
      includeLifecycle: true,
      ...entityIdentityFromIdKey(PRISMA_SCHEMA_IDENTITY.idKey),
    },
  );

  const { schemaText: generatedModels, manifest } =
    jsonSchema2PrismaWithManifest(persistenceSchema, new WeakSet(), {
      databaseProvider: provider,
      reverseMap: {},
    });

  let modelDefinitions = generatedModels;

  if (provider !== "mongodb") {
    modelDefinitions = applyFrameworkNativeLifecycleColumns(modelDefinitions);
    modelDefinitions += graviolaStatementsModelText();
  }

  const prismaMajor = getInstalledPrismaMajorVersion();
  console.log(
    `[setup-prisma] Prisma CLI major: ${prismaMajor} (from installed prisma package)`,
  );

  const datasourceBlock =
    prismaMajor === 7
      ? `datasource db {
  provider = "${provider}"
}`
      : `datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}`;

  const schemaContent = `// Auto-generated by setupPrismaCore — do not edit by hand.
// Regenerated when the setup:prisma script runs or a Prisma adapter connects.

generator client {
  provider = "prisma-client-js"
}

${datasourceBlock}

${modelDefinitions}
`;

  const appRoot = join(import.meta.dir, "..");
  const prismaDir = join(appRoot, "prisma");
  mkdirSync(prismaDir, { recursive: true });

  const schemaPath = join(prismaDir, "schema.prisma");
  writeFileSync(schemaPath, schemaContent, "utf-8");
  console.log(`[setup-prisma] Written: ${schemaPath}`);

  const manifestPath = join(prismaDir, "persistence-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`[setup-prisma] Written: ${manifestPath}`);

  const prismaConfigPath = join(appRoot, "prisma.config.ts");
  if (prismaMajor === 7) {
    const prismaConfigContent = `// Used by Prisma 7+ CLI; connection URL is not allowed in schema.prisma
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
`;
    writeFileSync(prismaConfigPath, prismaConfigContent, "utf-8");
    console.log(`[setup-prisma] Written: ${prismaConfigPath}`);
  } else if (existsSync(prismaConfigPath)) {
    rmSync(prismaConfigPath);
    console.log(
      `[setup-prisma] Removed Prisma 7-only config (using Prisma 6): ${prismaConfigPath}`,
    );
  }

  const env = { ...process.env, DATABASE_URL: databaseUrl };

  console.log("[setup-prisma] Running prisma generate...");
  execSync("prisma generate", {
    stdio: "inherit",
    env,
    cwd: appRoot,
  });
  invalidateGeneratedPrismaClientCache();

  if (provider === "sqlite") {
    removeSqliteDatabaseFiles(databaseUrl, appRoot);
    console.log(
      "[setup-prisma] Running prisma db push (sqlite: fresh file, no --force-reset)...",
    );
    execSync("prisma db push", {
      stdio: "inherit",
      env,
      cwd: appRoot,
    });
  } else {
    console.log("[setup-prisma] Running prisma db push --force-reset...");
    execSync("prisma db push --force-reset --accept-data-loss", {
      stdio: "inherit",
      env,
      cwd: appRoot,
    });
  }

  console.log("[setup-prisma] Prisma setup complete.");
}
