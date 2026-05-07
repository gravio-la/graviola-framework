import type { ReadResult } from "../envelope";
import type { EntityOf, SchemaRegistry } from "../registry";

export interface Loads<R extends SchemaRegistry> {
  /**
   * Load a single entity by IRI. Pass `{ withMeta: true }` for `ReadResult` envelope.
   */
  loadOne<T extends keyof R & string>(
    typeName: T,
    iri: string,
    options?: { withMeta?: false },
  ): Promise<EntityOf<R, T> | null>;

  loadOne<T extends keyof R & string>(
    typeName: T,
    iri: string,
    options: { withMeta: true },
  ): Promise<ReadResult<EntityOf<R, T>> | null>;
}
