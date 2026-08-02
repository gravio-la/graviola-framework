import type {
  StagedChangeSet,
  StagedEntity,
} from "@graviola/edb-import-staging";
import { WIKIDATA_AUTHORITY_IRI, WIKIDATA_ENTITY_PREFIX } from "./types";

export type CanonicalizeOptions = {
  instanceBase: string;
  typeIRItoTypeName: (iri: string) => string;
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

const qidFromWikidataIri = (iri: string): string | null => {
  if (!iri.startsWith(WIKIDATA_ENTITY_PREFIX)) return null;
  const qid = iri.slice(WIKIDATA_ENTITY_PREFIX.length);
  return /^Q\d+$/i.test(qid) ? qid : null;
};

export const canonicalIriFor = (
  instanceBase: string,
  typeName: string,
  qid: string,
): string => `${instanceBase}${typeName}/${qid}`;

const coerceWikidataLiterals = (document: Record<string, unknown>): void => {
  const population = document.population;
  if (typeof population === "string") {
    const match = population.match(/^\+?(\d+)/);
    if (match) document.population = Number.parseInt(match[1]!, 10);
  }

  const founded = document.founded;
  if (typeof founded === "string") {
    const match = founded.match(/^\+?(-?\d{1,4})/);
    if (match) document.founded = Number.parseInt(match[1]!, 10);
  }

  for (const key of ["latitude", "longitude"] as const) {
    const value = document[key];
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      if (!Number.isNaN(n)) document[key] = n;
    }
  }

  if (document.nameVariants === "") {
    delete document.nameVariants;
  }
};

/**
 * Rewrite temporary staging IRIs to deterministic
 * `{instanceBase}{TypeName}/{QID}` IRIs based on idAuthority,
 * fix all nested @id references, strip non-deterministic fields,
 * and attach owl:sameAs to the Wikidata entity.
 */
export const canonicalizeChangeSet = (
  changeSet: StagedChangeSet,
  options: CanonicalizeOptions,
): StagedEntity[] => {
  const { instanceBase, typeIRItoTypeName } = options;
  const iriMap = new Map<string, string>();

  for (const entity of changeSet.list()) {
    const idAuthority = readIdAuthority(entity.document);
    const qid =
      idAuthority?.authority === WIKIDATA_AUTHORITY_IRI
        ? qidFromWikidataIri(idAuthority.id)
        : null;
    if (!qid) {
      throw new Error(
        `Cannot canonicalize ${entity.entityIRI}: missing Wikidata idAuthority`,
      );
    }
    const typeName = typeIRItoTypeName(entity.typeIRI);
    iriMap.set(entity.entityIRI, canonicalIriFor(instanceBase, typeName, qid));
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
    coerceWikidataLiterals(rewritten);

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
