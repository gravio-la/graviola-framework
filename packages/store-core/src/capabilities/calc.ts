export type CalcWarmResult = {
  warmed: number;
  skippedFresh: number;
  writesIssued: number;
  queriesIssued: number;
};

/**
 * Store-level (not per-type) calc materialization, attached at store-construction
 * time by `@graviola/store-factory` when a calc config is supplied alongside
 * `statementMeta`. Kept loosely typed here (no `CompiledProfile`/`JSONSchema7`
 * import) so Layer 1 (`store-core`) never depends on Layer 2 (`calc-engine`,
 * `formula-dependency`) — the real implementation lives in
 * `@graviola/calc-engine`'s `warm()`.
 */
export interface Calc {
  calcWarm(
    rootIRIs?: string[],
    options?: { skipFresh?: boolean },
  ): Promise<CalcWarmResult>;
}
