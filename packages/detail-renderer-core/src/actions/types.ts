import type {
  EntityActionDef,
  HostCapabilities,
  ViewDensity,
} from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";

export type ActionSurface =
  | "chip"
  | "listItem"
  | "card"
  | "detail"
  | "tableRow"
  | "tableBulk";

export type EntityActionTarget = {
  entityIRI?: string;
  typeIRI?: string;
  typeName?: string;
  data: unknown;
};

/** Minimal intent shape — callers pass GraviolaIntent from state-hooks. */
export type EntityIntent = {
  kind: string;
  [key: string]: unknown;
};

export type EntityIntentDispatch = (
  intent: EntityIntent,
) => void | Promise<unknown>;

export type EntityActionContext = {
  surface: ActionSurface;
  density: ViewDensity;
  rootSchema: JSONSchema7;
  typeName?: string;
  typeIRI?: string;
  targets: EntityActionTarget[];
  capabilities: HostCapabilities;
  dispatchIntent: EntityIntentDispatch;
  t?: (key: string, opts?: unknown) => string;
};

export type EntityActionEntry = {
  name: string;
  /** Omit = all surfaces; else restrict to listed surfaces. */
  surfaces?: ActionSurface[];
  /** All must be present on the host for this entry to apply. */
  requiresCapabilities?: import("@graviola/edb-core-types").HostCapabilityId[];
  /** -1 = not applicable; higher rank = more important = inline slot. */
  tester: (schema: JSONSchema7, ctx: EntityActionContext) => number;
  build: (ctx: EntityActionContext) => EntityActionDef | undefined;
  /** Optional custom renderer component name — resolved in detail-renderer. */
  rendererKey?: string;
};

export type ResolvedEntityAction = {
  def: EntityActionDef;
  entry: EntityActionEntry | null;
  rank: number;
};

export type EntityActionsConfig = {
  registry?: EntityActionEntry[];
  /** Max inline actions before overflow menu; default 2. */
  maxVisible?: number;
};
