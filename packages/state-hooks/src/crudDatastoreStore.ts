import type {
  BaseStore,
  Counts,
  Exists,
  Filters,
  FlatResultSet,
  Lists,
  Loads,
  Removes,
  Resolves,
  SchemaRegistry,
  Searches,
  Streams,
  Writes,
} from "@graviola/store-core";

/**
 * Store surface supplied by {@link CrudProviderContext}. Hooks and table UIs rely on
 * capability composition; optional fragments are marked {@link Partial} so REST and
 * thin clients stay assignable.
 */
export type CrudDatastoreStore<R extends SchemaRegistry = SchemaRegistry> =
  BaseStore<R> &
    Loads<R> &
    Filters<R> &
    Writes<R> &
    Removes<R> &
    Exists<R> &
    Resolves &
    Partial<
      Counts<R> & Searches<R> & Lists<R> & FlatResultSet<R> & Streams<R>
    > & {
      /**
       * SPARQL/extension hook for authority-ID joins (not on every Store implementation).
       */
      findDocumentsByAuthorityIRI?: (
        typeName: string,
        authorityIRI: string,
        repositoryIRI?: string,
        limit?: number,
      ) => Promise<any[]>;
    };
