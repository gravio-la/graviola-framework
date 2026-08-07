import type { CreateStoreFromSpecOptions, CreatedStore } from "./types.js";

/**
 * Attach `calcWarm` + `readCalcValues` + `capabilities.calc` to a built store
 * when both `calc` and `statementMeta` config were supplied. No-op otherwise.
 * `@graviola/calc-engine` is imported lazily so consumers who never configure
 * `calc` pay nothing. Both methods share the same precondition (calc +
 * statementMeta) since `readCalcValues`'s freshness check needs the
 * statement sidecars `calcWarm` writes — one capability flag covers both.
 */
export async function attachCalcWarm(
  store: CreatedStore,
  opts: CreateStoreFromSpecOptions,
): Promise<void> {
  if (!opts.calc || !opts.statementMeta) return;

  const { warm, readCalcValues } = await import("@graviola/calc-engine");
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

  (store as Record<string, unknown>).readCalcValues = (rootIRI: string) =>
    readCalcValues(
      store as never,
      profile as never,
      rootTypeName,
      domainSchema,
      rootIRI,
    );

  (store as { capabilities: Record<string, unknown> }).capabilities = {
    ...store.capabilities,
    calc: true,
  };
}
