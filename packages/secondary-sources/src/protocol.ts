/** WebSocket import session protocol (client ↔ mapping-proxy-server). */

export type ImportMode = "preview" | "commit";

export type ImportStartMessage = {
  type: "start";
  sourceId: string;
  modelSlug: string;
  targetType: string;
  iri: string;
  databaseId: string;
  mode: ImportMode;
  mappingId?: string;
};

export type ImportReviewMessage = {
  type: "review";
  entityIRI: string;
  state: "pending" | "accepted" | "rejected";
};

export type ImportCommitMessage = { type: "commit" };
export type ImportDiscardMessage = { type: "discard" };

export type ImportClientMessage =
  | ImportStartMessage
  | ImportReviewMessage
  | ImportCommitMessage
  | ImportDiscardMessage;

export type ImportStagedEvent = {
  type: "staged";
  entity: {
    entityIRI: string;
    typeIRI: string;
    depth: number;
    reviewState: string;
    trace: { decision: string; matchMethod?: string; mappingPath: string[] };
    document: Record<string, unknown>;
  };
};

export type ImportUpdatedEvent = {
  type: "updated";
  entity: ImportStagedEvent["entity"];
};
export type ImportApplyProgressEvent = {
  type: "apply-progress";
  done: number;
  total: number;
  currentIRI: string;
};
export type ImportAppliedEvent = { type: "applied"; appliedIRIs: string[] };
export type ImportDiscardedEvent = { type: "discarded" };
export type ImportFetchEvent = { type: "fetch"; provenance: unknown };
export type ImportLogEvent = {
  type: "log";
  message: string;
  level?: "info" | "warn" | "error";
};
export type ImportErrorEvent = {
  type: "error";
  message: string;
  code?: string;
};
export type ImportDoneEvent = {
  type: "done";
  appliedIRIs: string[];
  rootIRI: string;
  runIRI: string;
};

export type ImportServerMessage =
  | ImportStagedEvent
  | ImportUpdatedEvent
  | ImportApplyProgressEvent
  | ImportAppliedEvent
  | ImportDiscardedEvent
  | ImportFetchEvent
  | ImportLogEvent
  | ImportErrorEvent
  | ImportDoneEvent;
