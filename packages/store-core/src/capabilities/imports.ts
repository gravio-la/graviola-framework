import type { Identifies } from "./identifies";
import type { EntityOf, SchemaRegistry } from "../registry";

/**
 * Minimal readable peer used as import source — avoids importing legacy `AbstractDatastore`.
 * Generic over the same schema registry as the importing store so `loadOne` narrows by type name.
 */
export type ReadableImportSource<R extends SchemaRegistry = SchemaRegistry> =
  Identifies & {
    loadOne<T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
    ): Promise<EntityOf<R, T> | null>;
  };

export interface Imports<R extends SchemaRegistry> {
  importOne<T extends keyof R & string>(
    typeName: T,
    entityIRI: string,
    source: ReadableImportSource<R>,
  ): Promise<EntityOf<R, T>>;

  importMany<T extends keyof R & string>(
    typeName: T,
    source: ReadableImportSource<R>,
    limit: number,
  ): Promise<EntityOf<R, T>[]>;
}
