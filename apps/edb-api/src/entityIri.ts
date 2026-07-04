export const ENTITY_BASE_IRI =
  "http://ontologies.slub-dresden.de/exhibition/entity/";

let entityCounter = 0;

export function createEntityIRI(typeName: string, id?: string): string {
  entityCounter += 1;
  const suffix =
    id ?? `api-${entityCounter}-${Math.random().toString(36).slice(2, 8)}`;
  return `${ENTITY_BASE_IRI}${typeName}/${suffix}`;
}

export function createEntityIRIFromTypeIRI(typeIRI: string): string {
  const typeName = typeIRI.split("#").pop() ?? "Entity";
  return createEntityIRI(typeName);
}
