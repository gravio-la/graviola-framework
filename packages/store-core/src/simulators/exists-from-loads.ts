import type { Loads } from "../capabilities/loads";
import type { Exists } from "../capabilities/exists";
import type { SchemaRegistry } from "../registry";

/**
 * Reference simulator: `exists` ≡ `loadOne(...) != null`.
 */
export function createExistsFromLoads<R extends SchemaRegistry>(
  loads: Loads<R>,
): Exists<R> {
  return {
    exists: async (typeName, entityIRI) => {
      const doc = await loads.loadOne(typeName as keyof R & string, entityIRI);
      return doc != null;
    },
  };
}
