import type { JSONSchema7 } from "json-schema";

import jobSchemaJson from "../generated/job.schema.json";

export const JOB_VOCAB_BASE = "https://graviola.gra.one/schema/job#";
export const JOB_INSTANCE_BASE = "https://graviola.gra.one/jobs/";
/** Named graph holding all JobRun / JobStep / SourceFetch / StagedEntityRecord triples. */
export const JOBS_GRAPH_IRI = "urn:graviola:jobs";

export const JOB_SCHEMA = jobSchemaJson as JSONSchema7;

export const jobRunIri = (id: string) => `${JOB_INSTANCE_BASE}JobRun/${id}`;
export const jobStepIri = (runId: string, ordinal: number) =>
  `${JOB_INSTANCE_BASE}JobStep/${runId}/${ordinal}`;
export const sourceFetchIri = (runId: string, ordinal: number, n: number) =>
  `${JOB_INSTANCE_BASE}SourceFetch/${runId}/${ordinal}/${n}`;
export const stagedEntityRecordIri = (runId: string, entityIRI: string) =>
  `${JOB_INSTANCE_BASE}StagedEntityRecord/${runId}/${encodeURIComponent(entityIRI)}`;
export const changeSetGraphIri = (id: string) => `urn:graviola:changeset:${id}`;

export type JobStatus =
  | "queued"
  | "running"
  | "awaiting-review"
  | "applying"
  | "done"
  | "partial"
  | "error"
  | "cancelled"
  | "discarded";

export type Intervention = "auto" | "review" | "assisted";
