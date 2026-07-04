export type CreationMethod = "mapping" | "ai-agent" | "file-import" | "manual";

export type ProvenanceEnvelope = {
  method: CreationMethod;
  /** e.g. "wikidata/Person" or mapping registry key */
  mappingId?: string;
  /** version of the mapping declaration (registry-provided) */
  mappingVersion?: string;
  /** $id or hash of the JSON Schema in force */
  schemaVersion?: string;
  /** authority IRI or file name of the source record */
  sourceRef?: string;
  timestamp: string; // ISO
};

export type StrategyTrace = {
  strategyId?: string; // e.g. "createEntityWithAuthoritativeLink"
  mappingPath: string[]; // StrategyContext.path at emit time
  decision: "created" | "matched-existing" | "augmented";
  matchMethod?: "sameAs" | "label" | "iri" | "none";
  probedAgainst?: ("staged" | "main")[];
  note?: string; // free-form debugging insight
};

export type StagedEntity = {
  entityIRI: string;
  typeIRI: string;
  document: Record<string, unknown>; // JSON-LD shaped (@id/@type)
  provenance: ProvenanceEnvelope;
  trace: StrategyTrace;
  /** IRI of the entity whose mapping caused this creation (tree edge) */
  parentIRI?: string;
  depth: number;
  /** user decision, default "pending"; "rejected" excluded from applyAll */
  reviewState: "pending" | "accepted" | "rejected";
};

export type ChangeSetEvent =
  | { kind: "staged"; entity: StagedEntity }
  | { kind: "updated"; entity: StagedEntity } // re-staged same IRI (merge)
  | {
      kind: "review-changed";
      entityIRI: string;
      reviewState: StagedEntity["reviewState"];
    }
  | { kind: "apply-progress"; done: number; total: number; currentIRI: string }
  | { kind: "applied"; appliedIRIs: string[] }
  | { kind: "discarded" };

export interface StagedChangeSet {
  /** stable identity — doubles as ContextIRI and (later) server session IRI */
  readonly changeSetIRI: string;

  stage(
    entity: Omit<StagedEntity, "reviewState" | "depth"> & { depth?: number },
  ): Promise<StagedEntity>;
  /** Move entity (and subtree) under a new parent; recomputes depths and emits `updated`. */
  reparent(entityIRI: string, newParentIRI: string): void;
  get(entityIRI: string): StagedEntity | undefined;
  list(): StagedEntity[]; // insertion order
  roots(): StagedEntity[]; // parentIRI === undefined
  childrenOf(entityIRI: string): StagedEntity[];

  setReviewState(entityIRI: string, state: StagedEntity["reviewState"]): void;

  /** commit accepted+pending entities to the target store (leaf-first order) */
  applyAll(
    target: {
      upsert(typeName: string, iri: string, doc: unknown): Promise<unknown>;
    },
    typeIRItoTypeName: (iri: string) => string,
  ): Promise<string[]>;
  discard(): void;

  subscribe(listener: (e: ChangeSetEvent) => void): () => void;

  /** RDFJS DatasetCore view of all staged docs (feeds the overlay) */
  readonly dataset: import("@rdfjs/types").DatasetCore;
}
