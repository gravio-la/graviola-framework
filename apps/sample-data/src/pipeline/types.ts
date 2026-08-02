import type {
  NormDataMappings,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import type {
  AuthorityConfiguration,
  DeclarativeMapping,
  DeclarativeMappings,
} from "@graviola/edb-data-mapping";
import type { JSONSchema7 } from "json-schema";

export type SampleDomainSeed = {
  /** Local typeName used when mapping seed entities (e.g. "City") */
  typeName: string;
  /** Relative path to a SPARQL SELECT file inside the domain folder */
  query: string;
  /** Variable name in the SELECT that holds the entity IRI (default: "city") */
  entityVar?: string;
  /** Default LIMIT applied when the query has no LIMIT / when --limit is omitted */
  limit?: number;
};

export type SampleDomain = {
  name: string;
  /** Vocabulary base, e.g. http://ontologies.gra.one/samples/geo# */
  baseIRI: string;
  /** Instance IRI base, e.g. http://ontologies.gra.one/samples/geo/ */
  instanceBase: string;
  schema: JSONSchema7;
  primaryFields: PrimaryFieldDeclaration;
  /** Declarative mappings keyed by local typeName */
  mappings: Record<string, DeclarativeMappings>;
  /** Optional sameAs type map (local typeName → Wikidata Q-ID class) */
  sameAsTypeMap?: Record<string, string | string[]>;
  /** Absolute path to the domain directory (set by the registry) */
  domainDir: string;
  seed: SampleDomainSeed;
  /** Relative path under domainDir for the Turtle output */
  output: string;
};

export type DefineSampleDomainInput = Omit<SampleDomain, "domainDir"> & {
  /** Absolute path; usually `import.meta.dir` from domain.ts */
  domainDir: string;
};

export const defineSampleDomain = (
  input: DefineSampleDomainInput,
): SampleDomain => input;

export type GenerateOptions = {
  refresh?: boolean;
  offline?: boolean;
  limit?: number;
  language?: string;
};

export type CacheStats = {
  hits: number;
  misses: number;
  writes: number;
};

export type ProgressLogger = {
  step: (n: number, total: number, label: string, detail: string) => void;
  info: (message: string) => void;
};

export const createConsoleProgress = (): ProgressLogger => ({
  step: (n, total, label, detail) => {
    console.log(`[${n}/${total}] ${label.padEnd(16)} ${detail}`);
  },
  info: (message) => {
    console.log(`      ${message}`);
  },
});

export type WikidataAuthorityBundle = {
  authorityAccess: Record<string, AuthorityConfiguration>;
  normDataMappings: NormDataMappings<DeclarativeMapping>;
};

export const WIKIDATA_AUTHORITY_IRI = "http://www.wikidata.org";
export const WIKIDATA_ENTITY_PREFIX = "http://www.wikidata.org/entity/";
