import type { SchemaRegistry } from "../registry";

export interface Removes<_R extends SchemaRegistry> {
  remove(typeName: string, entityIRI: string): Promise<unknown>;
}
