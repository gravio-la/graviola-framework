import type { MetaAnnotationProjection } from "@graviola/meta-schema";
import { ENTITY_META_PERSISTENCE_KEY } from "@graviola/meta-schema";

const makePrefixed = (key: string) => (key.includes(":") ? key : `:${key}`);

export type AnnotationSelectFragments = {
  select: string;
  where: string;
};

export type AnnotationProjectionsToSparqlOptions = {
  entityVar?: string;
  containerKey?: string;
};

/**
 * Build OPTIONAL entityMeta patterns and SAMPLE aggregates for flat SELECT listings.
 * Kept separate from the domain property walk in jsonSchema2Select.
 */
export function annotationProjectionsToSparql(
  projections: MetaAnnotationProjection[],
  options?: AnnotationProjectionsToSparqlOptions,
): AnnotationSelectFragments {
  if (!projections.length) {
    return { select: "", where: "" };
  }

  const entityVar = options?.entityVar ?? "?entity";
  const containerKey = options?.containerKey ?? ENTITY_META_PERSISTENCE_KEY;
  const containerVar = `?${containerKey}`;

  const innerTriples = projections
    .map((projection) => {
      const leafVar = `?${projection.persistenceSegments.join("_")}`;
      return `${containerVar} ${makePrefixed(projection.leafKey)} ${leafVar} .`;
    })
    .join("\n    ");

  const where = `OPTIONAL { ${entityVar} ${makePrefixed(containerKey)} ${containerVar} .\n    ${innerTriples}\n}`;

  const select = projections
    .map((projection) => {
      const leafVar = `?${projection.persistenceSegments.join("_")}`;
      return `(SAMPLE(${leafVar}) AS ?${projection.sparqlVar})`;
    })
    .join(" ");

  return {
    select: ` ${select}`,
    where: ` ${where}`,
  };
}
