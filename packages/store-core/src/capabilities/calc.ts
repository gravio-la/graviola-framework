import type { FreshnessState } from "../envelope";

export type CalcWarmResult = {
  warmed: number;
  skippedFresh: number;
  writesIssued: number;
  queriesIssued: number;
};

export type ReadCalcValuesResult = {
  value: Record<string, unknown> | null;
  freshness: FreshnessState;
};

/**
 * Store-level (not per-type) calc materialization, attached at store-construction
 * time by `@graviola/store-factory` when a calc config is supplied alongside
 * `statementMeta`. Kept loosely typed here (no `CompiledProfile`/`JSONSchema7`
 * import) so Layer 1 (`store-core`) never depends on Layer 2 (`calc-engine`,
 * `formula-dependency`) — the real implementation lives in
 * `@graviola/calc-engine`'s `warm()`/`readCalcValues()`.
 */
export interface Calc {
  calcWarm(
    rootIRIs?: string[],
    options?: { skipFresh?: boolean },
  ): Promise<CalcWarmResult>;
  /** Materialized-first read for one root entity — see `readCalcValues()` in `@graviola/calc-engine`. */
  readCalcValues(rootIRI: string): Promise<ReadCalcValuesResult>;
}
