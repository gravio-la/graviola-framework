import type { JSONSchema7 } from "json-schema";
import type { CompiledProfile } from "@graviola/formula-dependency";
import type { EntityChangeEvent, Unsubscribe } from "@graviola/store-core";
import {
  subscribeCalcInvalidation,
  warm,
  type AffectedInstancePlanner,
  type WarmResult,
  type WarmStore,
} from "@graviola/calc-engine";

export type CalcWorkerStore = WarmStore & {
  subscribe: (listener: (event: EntityChangeEvent) => void) => Unsubscribe;
};

export type CreateCalcWorkerOptions = {
  store: CalcWorkerStore;
  profile: CompiledProfile;
  domainSchema: JSONSchema7;
  rootTypeName: string;
  affectedPlanner?: AffectedInstancePlanner;
  agent?: string;
  /** Full sweep of every root before subscribing (cold-start materialization). Default `true`. */
  warmOnStart?: boolean;
};

export type CalcWorker = {
  /** Warm every root (or the given `rootIRIs`) on demand. */
  warmNow: (rootIRIs?: string[]) => Promise<WarmResult>;
  /** Unsubscribe from the store change bus. */
  stop: () => void;
};

/**
 * Compose `@graviola/calc-engine`'s `warm()` (cold-start sweep) and
 * `subscribeCalcInvalidation()` (live re-warm on change) into one host-agnostic
 * worker. No new algorithm — this package's only job is that composition, so
 * it stays runnable from any process (a Bun HTTP server, a CLI, a cron job)
 * without pulling in a transport.
 */
export async function createCalcWorker(
  opts: CreateCalcWorkerOptions,
): Promise<CalcWorker> {
  const {
    store,
    profile,
    domainSchema,
    rootTypeName,
    affectedPlanner,
    agent,
    warmOnStart = true,
  } = opts;

  if (warmOnStart) {
    await warm(store, profile, rootTypeName, domainSchema, {
      agent,
      skipFresh: true,
    });
  }

  const handle = subscribeCalcInvalidation({
    store,
    profile,
    domainSchema,
    rootTypeName,
    affectedPlanner,
    agent,
  });

  return {
    warmNow: (rootIRIs?: string[]) =>
      warm(store, profile, rootTypeName, domainSchema, {
        rootIRIs,
        agent,
        skipFresh: false,
      }),
    stop: () => handle.unsubscribe(),
  };
}
