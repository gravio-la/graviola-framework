import type { AbstractDatastore } from "@graviola/edb-global-types";

/**
 * Declares which optional AbstractDatastore operations are supported by a given adapter.
 * Required operations (crud, listDocuments, findDocuments) are always assumed to be supported.
 */
export type DatastoreCapabilities = {
  /** Basic CRUD: upsertDocument, loadDocument, existsDocument, removeDocument */
  crud: true;
  /** listDocuments */
  listDocuments: true;
  /** findDocuments with QueryType (search, pagination, sorting) */
  findDocuments: true;
  /** Optional: countDocuments */
  countDocuments: boolean;
  /** Optional: findDocumentsByLabel */
  findDocumentsByLabel: boolean;
  /** Optional: findDocumentsByAuthorityIRI */
  findDocumentsByAuthorityIRI: boolean;
  /** Optional: findDocumentsAsFlatResultSet */
  findDocumentsAsFlatResultSet: boolean;
  /** Optional: getClasses */
  getClasses: boolean;
  /** Optional: importDocument / importDocuments */
  importDocuments: boolean;
  /** Optional: iterableImplementation */
  iterables: boolean;
  /** Optional: filterTypedDocument / filterTypedDocuments */
  filterTyped: boolean;
  /** Optional: findEntityByTypeName */
  findEntityByTypeName: boolean;
};

/**
 * Adapter wraps a datastore implementation for use in contract tests.
 * Each adapter handles its own lifecycle (setup, teardown, reset between tests).
 */
export type DatastoreAdapter = {
  /** Human-readable name, used in test output. E.g. "SPARQL/Oxigraph (local)" */
  name: string;
  /** Declared capabilities — drives which test suites are run */
  capabilities: DatastoreCapabilities;
  /** Called once in beforeAll: initialise the connection / in-memory store */
  setup: () => Promise<AbstractDatastore>;
  /** Called in beforeEach: wipe all data without teardown/setup cycle */
  clearAll: (store: AbstractDatastore) => Promise<void>;
  /** Called once in afterAll: disconnect / cleanup resources */
  teardown: () => Promise<void>;
};
