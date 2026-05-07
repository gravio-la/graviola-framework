import type { EntityOf, SchemaRegistry } from "../registry";

export interface Writes<R extends SchemaRegistry> {
  upsert<T extends keyof R & string>(
    typeName: T,
    entityIRI: string,
    document: EntityOf<R, T>,
  ): Promise<EntityOf<R, T>>;
}
