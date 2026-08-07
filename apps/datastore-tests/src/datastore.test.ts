/**
 * Main datastore contract test entry point.
 *
 * Runs all contract suite functions against every active adapter's Store implementation.
 * Active adapters are determined by environment variables (see adapters/index.ts).
 *
 * Default adapters (no env var), unless SKIP_DEFAULT_ADAPTER=1:
 *   - SPARQL/Oxigraph (in-process)
 *   - Prisma/SQLite (schema generated on adapter setup; disable with SKIP_PRISMA=1)
 *
 * Opt-in adapters:
 *   OXIGRAPH_URL=http://localhost:7878    → SPARQL/Oxigraph (Docker)
 *   BLAZEGRAPH_URL=http://localhost:9999/bigdata  → SPARQL/Blazegraph (Docker)
 *   POSTGRES_URL=postgresql://...        → Prisma/PostgreSQL
 *   MARIADB_URL=mysql://...              → Prisma/MariaDB
 *   MONGODB_URL=mongodb://...            → Prisma/MongoDB (Docker single-node RS: add
 *                                          ?authSource=admin&directConnection=true&replicaSet=rs0)
 *
 * SKIP_DEFAULT_ADAPTER=1 — run only backends selected via env (omit default Oxigraph + default SQLite Prisma).
 *   Example: SKIP_DEFAULT_ADAPTER=1 MARIADB_URL=mysql://… bun test
 *   Include SQLite Prisma in that mode by setting SQLITE_URL explicitly.
 *
 * Prefer running tests inside the flake devShell so Prisma engine paths match catalog clients:
 *
 * Usage:
 *   nix develop -c sh -lc 'cd apps/datastore-tests && bun test'
 *   nix develop -c sh -lc 'cd apps/datastore-tests && SKIP_PRISMA=1 bun test'
 */
import { describe, afterAll, beforeEach } from "bun:test";
import { hasCapability } from "@graviola/store-core";
import type { CapabilityName } from "@graviola/store-core";

import { getActiveAdapters, createSourceOxigraphStore } from "./adapters";
import type {
  DatastoreContractStore,
  DatastoreContractStoreWithCounts,
  DatastoreContractStoreWithFilters,
  DatastoreContractStoreWithFlat,
  DatastoreContractStoreWithImports,
  DatastoreContractStoreWithResolves,
  DatastoreContractStoreWithSearches,
  DatastoreContractStoreWithStreams,
} from "./types";

import { runCrudSuite } from "./suites/crud.suite";
import { runQuerySuite } from "./suites/query.suite";
import { runCountSuite } from "./suites/count.suite";
import { runFlatResultSetSuite } from "./suites/flatResultSet.suite";
import { runImportSuite } from "./suites/import.suite";
import { runClassesSuite } from "./suites/classes.suite";
import { runIterableSuite } from "./suites/iterable.suite";
import { runFindByLabelSuite } from "./suites/findByLabel.suite";
import { runTypedFilterSuite } from "./suites/typedFilter.suite";
import {
  runCalcEngineSuite,
  runCalcEngineRealStoreSuite,
} from "./suites/calcEngine.suite";
import { runMetaSuite } from "./suites/meta.suite";
import { runFormulaPortabilitySuite } from "./suites/formulaPortability.suite";
import {
  runStatementMetaSuite,
  runStatementMetaWithEntityMetaSuite,
} from "./suites/statement-meta.suite";

// ─── Adapter loop ─────────────────────────────────────────────────────────────
// Top-level await is supported in bun:test — adapters are resolved before
// any describe blocks are collected.

const adapters = await getActiveAdapters();

if (adapters.length === 0) {
  throw new Error(
    "No datastore adapters. With SKIP_DEFAULT_ADAPTER=1 you must set at least one backend " +
      "(e.g. MARIADB_URL, OXIGRAPH_URL, SQLITE_URL, …). " +
      "Unset SKIP_DEFAULT_ADAPTER to use the default Oxigraph + Prisma/SQLite.",
  );
}

for (const adapter of adapters) {
  const setupResult = await adapter.setup();

  describe(adapter.name, () => {
    const store: DatastoreContractStore = setupResult.store;
    const metaStampingStore = setupResult.metaStampingStore;

    afterAll(async () => {
      await adapter.teardown();
    });

    beforeEach(async () => {
      await adapter.clearAll();
    });

    /** Suite gating — uses runtime capability descriptor exposed by each Store implementation. */
    const supports = (capability: CapabilityName): boolean =>
      hasCapability(store, capability);

    runCrudSuite(() => store);
    runQuerySuite(() => store);
    runFormulaPortabilitySuite(() => store);

    if (supports("counts")) {
      runCountSuite(() => store as unknown as DatastoreContractStoreWithCounts);
    }

    if (supports("flatResultSet")) {
      runFlatResultSetSuite(
        () => store as unknown as DatastoreContractStoreWithFlat,
      );
    }

    if (supports("imports")) {
      runImportSuite(
        () => store as unknown as DatastoreContractStoreWithImports,
        createSourceOxigraphStore,
      );
    }

    if (supports("resolves")) {
      runClassesSuite(
        () => store as unknown as DatastoreContractStoreWithResolves,
      );
    }

    if (supports("streams")) {
      runIterableSuite(
        () => store as unknown as DatastoreContractStoreWithStreams,
      );
    }

    if (supports("searches")) {
      runFindByLabelSuite(
        () => store as unknown as DatastoreContractStoreWithSearches,
      );
    }

    if (supports("filters")) {
      runTypedFilterSuite(
        () => store as unknown as DatastoreContractStoreWithFilters,
      );
      runCalcEngineSuite(
        () => store as unknown as DatastoreContractStoreWithFilters,
      );
    }

    if (setupResult.calcStore) {
      runCalcEngineRealStoreSuite(() => setupResult.calcStore!);
    }

    if (supports("writes")) {
      runMetaSuite(
        () => store,
        metaStampingStore ? () => metaStampingStore : undefined,
        setupResult.metaStampingStores,
      );
    }

    if (setupResult.statementStore) {
      runStatementMetaSuite(
        () => store,
        () => setupResult.statementStore!,
        setupResult.statementStoreRdf12
          ? () => setupResult.statementStoreRdf12!
          : undefined,
      );
      runStatementMetaWithEntityMetaSuite(
        setupResult.statementMetaStampingStore
          ? () => setupResult.statementMetaStampingStore!
          : undefined,
      );
    }
  });
}
