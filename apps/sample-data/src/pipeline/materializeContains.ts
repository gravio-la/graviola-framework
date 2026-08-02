import type { StagedEntity } from "@graviola/edb-import-staging";

const readPartOfId = (document: Record<string, unknown>): string | null => {
  const partOf = document.partOf;
  if (!partOf || typeof partOf !== "object" || Array.isArray(partOf)) {
    return null;
  }
  const id = (partOf as { "@id"?: unknown })["@id"];
  return typeof id === "string" && id.length > 0 ? id : null;
};

/**
 * Write forward `contains` arrays from inverted `partOf` edges among entities
 * already in the change set.
 *
 * Why not map Wikidata P150 directly? P150 fans out to every administrative
 * child on Wikidata (often dozens per district), which breaks offline cache
 * reproducibility and bloats the fixture. P131 → `partOf` already gives us
 * the closed subgraph we care about; materializing the forward edge keeps
 * `include.contains { take/skip/orderBy }` demos working without `x-inverseOf`.
 */
export const materializeContainsFromPartOf = (
  entities: StagedEntity[],
): StagedEntity[] => {
  const byIri = new Map<string, StagedEntity>();
  for (const entity of entities) {
    byIri.set(entity.entityIRI, entity);
  }

  const childrenByParent = new Map<string, string[]>();
  for (const entity of entities) {
    const parentIri = readPartOfId(entity.document);
    if (!parentIri || !byIri.has(parentIri)) continue;
    const list = childrenByParent.get(parentIri) ?? [];
    list.push(entity.entityIRI);
    childrenByParent.set(parentIri, list);
  }

  return entities.map((entity) => {
    const childIris = childrenByParent.get(entity.entityIRI);
    const document = { ...entity.document };
    if (!childIris || childIris.length === 0) {
      delete document.contains;
      return { ...entity, document };
    }
    const uniqueSorted = [...new Set(childIris)].sort((a, b) =>
      a.localeCompare(b),
    );
    document.contains = uniqueSorted.map((id) => ({ "@id": id }));
    return { ...entity, document };
  });
};
