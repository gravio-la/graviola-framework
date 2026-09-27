import type { ReadResult } from "../envelope";
import type { SchemaRegistry } from "../registry";

export type CalcWarmResult = {
  warmed: number;
  skippedFresh: number;
  writesIssued: number;
  queriesIssued: number;
};

export type CalcValues = Record<string, unknown>;

/** One entry per requested IRI, in request order. `data === null` → entity absent. */
export type CalcValuesEntry = {
  entityIRI: string;
} & ReadResult<CalcValues | null>;

/**
 * This store instance has compiled calc profiles bound per root type and can
 * materialize and serve computed values, locally or over REST. Requires the
 * `statements` capability. Attached at store-construction time by
 * `@graviola/store-factory`; the engine lives in `@graviola/calc-engine`.
 * Kept loosely typed here (no `CompiledProfile`/`JSONSchema7` import) so Layer 1
 * (`store-core`) never depends on Layer 2 (`calc-engine`, `formula-dependency`).
 */
export interface Calc<R extends SchemaRegistry = SchemaRegistry> {
  /** Materialize computed slots for `typeName` roots (all roots when `rootIRIs` omitted). */
  calcWarm<T extends keyof R & string>(
    typeName: T,
    options?: { rootIRIs?: string[]; skipFresh?: boolean },
  ): Promise<CalcWarmResult>;
  /** Materialized-first batch read; stale/never-materialized entries are re-derived, never written back. */
  readCalcValues<T extends keyof R & string>(
    typeName: T,
    entityIRIs: string[],
  ): Promise<CalcValuesEntry[]>;
}
