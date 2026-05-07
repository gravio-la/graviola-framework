import type { Entity } from "@graviola/edb-core-types";
import type { EntityOf, SchemaRegistry } from "../registry";

export interface Searches<R extends SchemaRegistry> {
  /** Resolve entities matching a label token within a type */
  searchByLabel<T extends keyof R & string>(
    typeName: T,
    label: string,
    limit?: number,
  ): Promise<EntityOf<R, T>[]>;

  /**
   * Lightweight rows for autocomplete / discovery (legacy name preserved).
   * Does not necessarily load full typed documents.
   */
  findEntityByTypeName(
    typeName: string,
    searchString: string,
    limit?: number,
  ): Promise<Entity[]>;
}
