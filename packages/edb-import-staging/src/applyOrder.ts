import type { StagedEntity } from "./types";

const collectDocumentRefIRIs = (
  document: Record<string, unknown>,
): string[] => {
  const refs: string[] = [];

  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    const record = value as Record<string, unknown>;
    if (typeof record["@id"] === "string") {
      refs.push(record["@id"]);
    }
    Object.values(record).forEach(walk);
  };

  Object.values(document).forEach(walk);
  return refs;
};

/**
 * Order entities so referenced IRIs are upserted before referencers.
 * Falls back to ascending creation depth when documents carry no cross-refs.
 */
export const referenceFirstApplyOrder = (
  entities: StagedEntity[],
): StagedEntity[] => {
  if (entities.length <= 1) return [...entities];

  const byIRI = new Map(entities.map((entity) => [entity.entityIRI, entity]));
  const applyIRIs = new Set(byIRI.keys());

  const dependencies = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();

  for (const entity of entities) {
    dependencies.set(entity.entityIRI, new Set());
    dependents.set(entity.entityIRI, new Set());
  }

  for (const entity of entities) {
    const refs = collectDocumentRefIRIs(entity.document).filter(
      (iri) => applyIRIs.has(iri) && iri !== entity.entityIRI,
    );
    for (const refIRI of refs) {
      dependencies.get(entity.entityIRI)!.add(refIRI);
      dependents.get(refIRI)!.add(entity.entityIRI);
    }
  }

  const inDegree = new Map(
    entities.map((entity) => [
      entity.entityIRI,
      dependencies.get(entity.entityIRI)!.size,
    ]),
  );

  const insertionIndex = new Map(
    entities.map((entity, index) => [entity.entityIRI, index]),
  );

  const queue = entities
    .filter((entity) => (inDegree.get(entity.entityIRI) ?? 0) === 0)
    .sort(
      (a, b) =>
        a.depth - b.depth ||
        (insertionIndex.get(a.entityIRI) ?? 0) -
          (insertionIndex.get(b.entityIRI) ?? 0),
    );

  const ordered: StagedEntity[] = [];

  while (queue.length > 0) {
    const next = queue.shift()!;
    ordered.push(next);

    const nextDependents = [...(dependents.get(next.entityIRI) ?? [])].sort(
      (left, right) => {
        const leftEntity = byIRI.get(left);
        const rightEntity = byIRI.get(right);
        return (
          (leftEntity?.depth ?? 0) - (rightEntity?.depth ?? 0) ||
          (insertionIndex.get(left) ?? 0) - (insertionIndex.get(right) ?? 0)
        );
      },
    );

    for (const dependentIRI of nextDependents) {
      const remaining = (inDegree.get(dependentIRI) ?? 0) - 1;
      inDegree.set(dependentIRI, remaining);
      if (remaining === 0) {
        const dependent = byIRI.get(dependentIRI);
        if (dependent) {
          queue.push(dependent);
          queue.sort(
            (a, b) =>
              a.depth - b.depth ||
              (insertionIndex.get(a.entityIRI) ?? 0) -
                (insertionIndex.get(b.entityIRI) ?? 0),
          );
        }
      }
    }
  }

  if (ordered.length !== entities.length) {
    const missing = entities.filter(
      (entity) => !ordered.some((item) => item.entityIRI === entity.entityIRI),
    );
    return [
      ...ordered,
      ...missing.sort(
        (a, b) =>
          a.depth - b.depth ||
          (insertionIndex.get(a.entityIRI) ?? 0) -
            (insertionIndex.get(b.entityIRI) ?? 0),
      ),
    ];
  }

  return ordered;
};
