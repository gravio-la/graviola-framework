import type {
  BaseStore,
  Counts,
  Exists,
  FlatResultSet,
  Filters,
  Imports,
  Lists,
  Loads,
  Removes,
  Resolves,
  Searches,
  Statements,
  Streams,
  Writes,
} from "@graviola/store-core";

/**
 * Schema registry for contract tests (`testSchema` definitions).
 */
export type TestSchemaRegistry = Record<string, unknown>;

/**
 * Core store shape exercised by baseline suites (CRUD + Query).
 */
export type DatastoreContractStore = BaseStore<TestSchemaRegistry> &
  Loads<TestSchemaRegistry> &
  Lists<TestSchemaRegistry> &
  Writes<TestSchemaRegistry> &
  Removes<TestSchemaRegistry> &
  Exists<TestSchemaRegistry>;

/** Optional suites: count — requires {@link Counts}. */
export type DatastoreContractStoreWithCounts = DatastoreContractStore &
  Counts<TestSchemaRegistry>;

/** Optional suites: flat result set — requires {@link FlatResultSet}. */
export type DatastoreContractStoreWithFlat = DatastoreContractStore &
  FlatResultSet<TestSchemaRegistry>;

/** Optional suites: RDF class resolution — requires {@link Resolves}. */
export type DatastoreContractStoreWithResolves = DatastoreContractStore &
  Resolves;

/** Optional suites: async iteration listing — requires {@link Streams}. */
export type DatastoreContractStoreWithStreams = DatastoreContractStore &
  Streams<TestSchemaRegistry>;

/** Optional suites: label search — requires {@link Searches}. */
export type DatastoreContractStoreWithSearches = DatastoreContractStore &
  Searches<TestSchemaRegistry>;

/** Optional suites: typed graph filters — requires {@link Filters}. */
export type DatastoreContractStoreWithFilters = DatastoreContractStore &
  Filters<TestSchemaRegistry>;

/** Optional suites: import — requires {@link Imports}. */
export type DatastoreContractStoreWithImports = DatastoreContractStore &
  Imports<TestSchemaRegistry>;

/** Optional suites: fact-level statement metadata — requires {@link Statements}. */
export type DatastoreContractStoreWithStatements = DatastoreContractStore &
  Statements<TestSchemaRegistry>;

/**
 * Fresh Store usable as seed data source for import suite tests (readable + writable baseline).
 */
export type ImportSeedStore = DatastoreContractStore;

/**
 * Optional meta-stamping store variants for lifecycle contract tests.
 */
export type MetaStampingStoreVariants = {
  lifecycleOff?: DatastoreContractStore;
  application?: DatastoreContractStore;
  /** SPARQL store with database-native config (descriptor should downgrade). */
  sparqlNativeConfig?: DatastoreContractStore;
};

/**
 * Adapter wraps one Store implementation for contract tests.
 */
export type DatastoreAdapter = {
  /** Human-readable name, used in test output. */
  name: string;
  /** Initialise store — invoked once before the adapter's describe block. */
  setup: () => Promise<{
    store: DatastoreContractStore;
    /** Same backing data; optional store with entity `$meta` stamping enabled. */
    metaStampingStore?: DatastoreContractStore;
    metaStampingStores?: MetaStampingStoreVariants;
    /** Store with fact-level `$stmt` (statement-node or side-table encoding). */
    statementStore?: DatastoreContractStoreWithStatements;
    /** SPARQL in-process only: RDF 1.2 reifier encoding variant. */
    statementStoreRdf12?: DatastoreContractStoreWithStatements;
    /** Statements + entity `$meta` stamping (for combined lifecycle tests). */
    statementMetaStampingStore?: DatastoreContractStoreWithStatements;
    /**
     * Same backing data; store bound to the garden-fee calc fixture schema
     * (`@graviola/calc-fixtures`) so the calc-engine suite can prove
     * `evaluateForRoots` against a real store read.
     */
    calcStore?: DatastoreContractStoreWithFilters;
  }>;
  /** Wipe backing data — invoked in beforeEach. */
  clearAll: () => Promise<void>;
  /** Disconnect / cleanup — invoked in afterAll. */
  teardown: () => Promise<void>;
};
