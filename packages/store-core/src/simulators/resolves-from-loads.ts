import type { Loads } from "../capabilities/loads";
import type { Resolves } from "../capabilities/resolves";
import type { SchemaRegistry } from "../registry";

/**
 * When the caller can resolve which logical `typeName` an IRI belongs to in O(1)
 * (registry / index), `resolveTypes` can derive class IRIs from the loaded JSON-LD `@type`.
 */
export function createResolvesFromLoads<R extends SchemaRegistry>(
  loads: Loads<R>,
  resolveTypeName: (entityIRI: string) => (keyof R & string) | undefined,
): Resolves {
  return {
    resolveTypes: async (entityIRI: string) => {
      const tn = resolveTypeName(entityIRI);
      if (!tn) return [];
      const doc = await loads.loadOne(tn, entityIRI);
      if (!doc || typeof doc !== "object") return [];
      const raw = (doc as { "@type"?: string | string[] })["@type"];
      if (typeof raw === "string") return [raw];
      if (Array.isArray(raw))
        return raw.filter((x) => typeof x === "string") as string[];
      return [];
    },
  };
}
