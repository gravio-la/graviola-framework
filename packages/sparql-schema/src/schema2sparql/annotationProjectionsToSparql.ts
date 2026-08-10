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

  // Walk intermediate segments and deduplicate shared paths
  // (e.g., provenance/activityId and provenance/agent share the provenance step)
  const tripleLines: string[] = [];
  const seenPaths = new Set<string>();

  for (const projection of projections) {
    const segments = projection.persistenceSegments;
    if (segments.length === 0) continue;

    // Walk from container through intermediate segments to leaf
    let prevVar = containerVar;
    for (let i = 0; i < segments.length; i++) {
      const pathKey = segments.slice(0, i + 1).join("/");
      if (seenPaths.has(pathKey)) {
        prevVar = `?${segments.slice(0, i + 1).join("_")}`;
        continue;
      }
      seenPaths.add(pathKey);

      const pathVar = `?${segments.slice(0, i + 1).join("_")}`;
      const pred = makePrefixed(segments[i]!);
      tripleLines.push(`${prevVar} ${pred} ${pathVar} .`);
      prevVar = pathVar;
    }
  }

  const where = tripleLines.length
    ? `OPTIONAL { ${entityVar} ${makePrefixed(containerKey)} ${containerVar} .\n    ${tripleLines.join("\n    ")}\n}`
    : "";

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
