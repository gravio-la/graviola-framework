import { join } from "node:path";
import { createFileCache } from "./cache";
import { canonicalizeChangeSet } from "./canonicalIRIs";
import { materializeContainsFromPartOf } from "./materializeContains";
import { createSampleDataSparqlFetcher } from "./sparqlFetcher";
import { runStep1Select } from "./step1-select";
import { createCachedEntityFetcher } from "./step2-entities";
import { runStep3Map } from "./step3-map";
import {
  createConsoleProgress,
  type GenerateOptions,
  type SampleDomain,
} from "./types";
import { writeTurtle } from "./writeTurtle";

export type GenerateResult = {
  outputPath: string;
  tripleCount: number;
  typeCounts: Record<string, number>;
  seedCount: number;
};

export const generateDomain = async (
  domain: SampleDomain,
  options: GenerateOptions = {},
): Promise<GenerateResult> => {
  const progress = createConsoleProgress();
  const cacheDir = join(domain.domainDir, "cache");
  const cache = createFileCache({
    cacheDir,
    refresh: options.refresh,
    offline: options.offline,
  });

  const select = await runStep1Select({
    domain,
    cache,
    limit: options.limit,
    sparqlFetcher: createSampleDataSparqlFetcher(),
    progress,
  });

  const entityFetcher = createCachedEntityFetcher({ cache, progress });

  // Warm cache for seed entities before mapping (visible as step 2 prefetch)
  for (const iri of select.entityIris) {
    await entityFetcher.getEntityByIRI(iri);
  }
  const afterSeeds = entityFetcher.stats();
  progress.step(
    2,
    3,
    "entity fetch",
    `${select.entityIris.length} seeds            (${afterSeeds.fetched} fetched, ${afterSeeds.cached} cached; parents may follow)`,
  );

  const mapped = await runStep3Map({
    domain,
    seedIris: select.entityIris,
    entityFetcher,
    progress: {
      ...progress,
      // step3-map prints steps 2+3; suppress its step 2, keep step 3
      step: (n, total, label, detail) => {
        if (n === 2) return;
        progress.step(n, total, label, detail);
      },
    },
  });

  const finalStats = entityFetcher.stats();
  progress.info(
    `entity cache totals: ${finalStats.fetched} fetched, ${finalStats.cached} cached`,
  );

  const typeIRItoTypeName = (iri: string) =>
    iri.startsWith(domain.baseIRI) ? iri.slice(domain.baseIRI.length) : iri;

  const canonical = canonicalizeChangeSet(mapped.changeSet, {
    instanceBase: domain.instanceBase,
    typeIRItoTypeName,
  });

  // Forward `contains` edges for include.take/skip demos (closed subgraph).
  const withContains = materializeContainsFromPartOf(canonical);

  // Recompute type counts after canonicalize (same entities)
  const typeCounts: Record<string, number> = {};
  for (const entity of withContains) {
    const typeName = typeIRItoTypeName(entity.typeIRI);
    typeCounts[typeName] = (typeCounts[typeName] ?? 0) + 1;
  }

  const outputPath = join(domain.domainDir, domain.output);
  const { tripleCount } = await writeTurtle({
    entities: withContains,
    outputPath,
    baseIRI: domain.baseIRI,
    propertyToIRI: (name) => `${domain.baseIRI}${name}`,
  });

  progress.info(
    `wrote ${domain.output}                   (${tripleCount} triples)`,
  );

  return {
    outputPath,
    tripleCount,
    typeCounts,
    seedCount: select.entityIris.length,
  };
};

export {
  defineSampleDomain,
  type SampleDomain,
  type GenerateOptions,
} from "./types";
