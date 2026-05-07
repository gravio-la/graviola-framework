import type { SchemaRegistry } from "../registry";

export interface Exists<_R extends SchemaRegistry> {
  exists(typeName: string, entityIRI: string): Promise<boolean>;
}
