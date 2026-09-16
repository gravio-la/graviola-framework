import type { EntityRef, EntityRefResolveContext } from "./types";

/** Resolve {@link EntityRef} to a concrete entity IRI using ambient KB context. */
export function resolveEntityIRI(
  ref: EntityRef,
  ctx: EntityRefResolveContext = {},
): string {
  if (ref.entityIRI) {
    return ref.entityIRI;
  }

  const { entityBaseIRI, baseIRI, typeNameToTypeIRI } = ctx;
  const prefix = entityBaseIRI ?? baseIRI ?? "";

  if (
    ref.entityId.startsWith("http://") ||
    ref.entityId.startsWith("https://")
  ) {
    return ref.entityId;
  }

  if (ref.typeName) {
    if (typeNameToTypeIRI) {
      const typeIRI = typeNameToTypeIRI(ref.typeName);
      if (typeIRI.endsWith("#") || typeIRI.endsWith("/")) {
        return `${typeIRI}${ref.entityId}`;
      }
      return `${typeIRI}/${ref.entityId}`;
    }
    return `${prefix}${ref.typeName}/${ref.entityId}`;
  }

  return `${prefix}${ref.entityId}`;
}

/** Derive typeName from entity IRI when missing on the ref. */
export function inferTypeNameFromIRI(
  entityIRI: string,
  ctx: EntityRefResolveContext = {},
): string | undefined {
  const { baseIRI, entityBaseIRI, typeNameToTypeIRI } = ctx;
  if (typeNameToTypeIRI) {
    for (const prefix of [entityBaseIRI, baseIRI].filter(Boolean)) {
      if (entityIRI.startsWith(prefix!)) {
        const rest = entityIRI.slice(prefix!.length);
        const slash = rest.indexOf("/");
        if (slash > 0) {
          return rest.slice(0, slash);
        }
      }
    }
  }
  const slash = entityIRI.lastIndexOf("/");
  if (slash < 0) {
    return undefined;
  }
  const before = entityIRI.slice(0, slash);
  const typeSlash = before.lastIndexOf("/");
  const hash = before.lastIndexOf("#");
  const splitAt = Math.max(typeSlash, hash);
  if (splitAt >= 0) {
    return before.slice(splitAt + 1);
  }
  return before;
}
