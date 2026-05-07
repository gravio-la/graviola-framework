import type {
  StoreDocumentsSearchOptions,
  StoreFilterTraversalOptions,
} from "../filter-options";
import type { EntityOf, SchemaRegistry } from "../registry";

export interface Filters<R extends SchemaRegistry> {
  filterOne<T extends keyof R & string>(
    typeName: T,
    entityIRI: string,
    options?: StoreFilterTraversalOptions<EntityOf<R, T>>,
  ): Promise<EntityOf<R, T> | null>;

  filterMany<T extends keyof R & string>(
    typeName: T,
    options?: StoreDocumentsSearchOptions<EntityOf<R, T>>,
  ): Promise<EntityOf<R, T>[]>;

  /** Entity IRI → RDF class IRIs for entities matching a typed `where` clause */
  getEntitiesWithClassesByFilter?<T = unknown>(
    options: StoreDocumentsSearchOptions<T>,
  ): Promise<Map<string, string[]>>;
}
