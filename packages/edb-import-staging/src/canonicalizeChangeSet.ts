import type { StagedChangeSet, StagedEntity } from "./types";

export type CanonicalizeOptions = {
  instanceBase: string;
  typeIRItoTypeName: (iri: string) => string;
  /**
   * Optional hook for domain-specific literal coercion (e.g. population strings).
   * Called on each document before returning.
   */
  coerceLiterals?: (document: Record<string, unknown>) => void;
  /**
   * Extract the local id segment from `idAuthority.id` (which may be a full
   * authority IRI). Defaults to the raw id string.
   */
  localIdExtractor?: (authorityId: string) => string;
};

const readIdAuthority = (
  document: Record<string, unknown>,
): { authority: string; id: string } | null => {
  const idAuthority = document.idAuthority;
  if (!idAuthority || typeof idAuthority !== "object") return null;
  const authority = (idAuthority as { authority?: string }).authority;
  const id = (idAuthority as { id?: string }).id;
  if (typeof authority !== "string" || typeof id !== "string") return null;
  return { authority, id };
};

export const canonicalIriFor = (
  instanceBase: string,
  typeName: string,
  localId: string,
): string => `${instanceBase}${typeName}/${localId}`;

/**
 * Rewrite temporary staging IRIs to deterministic
 * `{instanceBase}{TypeName}/{localId}` IRIs based on idAuthority,
 * fix all nested @id references, strip non-deterministic fields,
 * and attach owl:sameAs to the authority entity.
 */
export const canonicalizeChangeSet = (
  changeSet: StagedChangeSet,
  options: CanonicalizeOptions,
): StagedEntity[] => {
  const { instanceBase, typeIRItoTypeName, coerceLiterals, localIdExtractor } =
    options;
  const iriMap = new Map<string, string>();

  for (const entity of changeSet.list()) {
    const idAuthority = readIdAuthority(entity.document);
    if (!idAuthority) {
      throw new Error(
        `Cannot canonicalize ${entity.entityIRI}: missing idAuthority`,
      );
    }
    const typeName = typeIRItoTypeName(entity.typeIRI);
    const localId = localIdExtractor
      ? localIdExtractor(idAuthority.id)
      : idAuthority.id;
    iriMap.set(
      entity.entityIRI,
      canonicalIriFor(instanceBase, typeName, localId),
    );
  }

  const rewriteValue = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rewriteValue);
    if (value === null || typeof value !== "object") return value;
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(record)) {
      if (key === "@id" && typeof child === "string" && iriMap.has(child)) {
        next[key] = iriMap.get(child);
        continue;
      }
      next[key] = rewriteValue(child);
    }
    return next;
  };

  return changeSet.list().map((entity) => {
    const canonicalIRI = iriMap.get(entity.entityIRI)!;
    const idAuthority = readIdAuthority(entity.document)!;
    const rewritten = rewriteValue(entity.document) as Record<string, unknown>;

    // Drop non-deterministic / staging-only fields
    delete rewritten.lastNormUpdate;
    delete rewritten.idAuthority;

    if (coerceLiterals) {
      coerceLiterals(rewritten);
    }

    rewritten["@id"] = canonicalIRI;
    rewritten["@type"] = entity.typeIRI;
    rewritten.sameAs = idAuthority.id;

    return {
      ...entity,
      entityIRI: canonicalIRI,
      parentIRI: entity.parentIRI
        ? (iriMap.get(entity.parentIRI) ?? entity.parentIRI)
        : undefined,
      document: rewritten,
    };
  });
};
