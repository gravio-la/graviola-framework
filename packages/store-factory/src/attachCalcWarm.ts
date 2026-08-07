import type { CreateStoreFromSpecOptions, CreatedStore } from "./types.js";

/**
 * Attach `calcWarm` + `capabilities.calc` to a built store when both `calc`
 * and `statementMeta` config were supplied. No-op otherwise. `@graviola/calc-engine`
 * is imported lazily so consumers who never configure `calc` pay nothing.
 */
export async function attachCalcWarm(
  store: CreatedStore,
  opts: CreateStoreFromSpecOptions,
): Promise<void> {
  if (!opts.calc || !opts.statementMeta) return;

  const { warm } = await import("@graviola/calc-engine");
  const { profile, domainSchema, rootTypeName, agent } = opts.calc;

  (store as Record<string, unknown>).calcWarm = (
    rootIRIs?: string[],
    warmOpts?: { skipFresh?: boolean },
  ) =>
    warm(store as never, profile as never, rootTypeName, domainSchema, {
      rootIRIs,
      skipFresh: warmOpts?.skipFresh,
      agent,
    });

  (store as { capabilities: Record<string, unknown> }).capabilities = {
    ...store.capabilities,
    calc: true,
  };
}
