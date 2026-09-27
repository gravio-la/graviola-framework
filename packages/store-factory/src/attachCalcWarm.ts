import type {
  CalcHostCapabilities,
  ReadCalcValuesStore,
  WarmStore,
} from "@graviola/calc-engine";
import type { CompiledProfile } from "@graviola/formula-dependency";
import type { Calc, SchemaRegistry } from "@graviola/store-core";
import type { CreateStoreFromSpecOptions, CreatedStore } from "./types.js";

/**
 * Attach the typed `Calc<R>` facet and its capability profile to a built store
 * when both `calc` and `statementMeta` config were supplied. No-op otherwise.
 * `@graviola/calc-engine` is imported lazily so consumers who never configure
 * calc pay nothing. Both methods share the same precondition because
 * `readCalcValues` checks the statement sidecars written by `calcWarm`.
 *
 * ## Calc host
 *
 * `warm()` and `readCalcValuesMany()` filter slots by host placement and cost.
 * When `opts.calc.host` is omitted, `SERVER_CALC_HOST` is used in Bun/Node
 * (server-side materialization includes `eval: "server"` and high-cost slots)
 * and `BROWSER_FORM_HOST` in the browser.
 */
export async function attachCalcWarm<R extends SchemaRegistry>(
  store: CreatedStore<R>,
  opts: CreateStoreFromSpecOptions<R>,
): Promise<void> {
  if (!opts.calc || !opts.statementMeta) return;

  const { warm, readCalcValuesMany, SERVER_CALC_HOST, BROWSER_FORM_HOST } =
    await import("@graviola/calc-engine");
  const defaultHost =
    typeof window === "undefined" ? SERVER_CALC_HOST : BROWSER_FORM_HOST;
  const host = (opts.calc.host ?? defaultHost) as CalcHostCapabilities;
  const engineStore = store as CreatedStore<R> &
    WarmStore &
    ReadCalcValuesStore;

  const bindingFor = (typeName: string) => {
    const binding = opts.calc?.bindings.find(
      (candidate) => candidate.rootTypeName === typeName,
    );
    if (!binding) {
      throw new Error(`Type "${typeName}" has no calc binding`);
    }
    return binding;
  };

  const calc = {
    calcWarm: async (typeName, { rootIRIs, skipFresh } = {}) => {
      const binding = bindingFor(typeName);
      return warm(
        engineStore,
        binding.profile as CompiledProfile,
        binding.rootTypeName,
        binding.domainSchema,
        {
          rootIRIs,
          skipFresh,
          agent: binding.agent,
          host,
        },
      );
    },
    readCalcValues: async (typeName, entityIRIs) => {
      const binding = bindingFor(typeName);
      const reports = await readCalcValuesMany(
        engineStore,
        binding.profile as CompiledProfile,
        binding.rootTypeName,
        binding.domainSchema,
        entityIRIs,
        { host },
      );
      return reports.map(({ entityIRI, data, provenance }) => ({
        entityIRI,
        data,
        provenance,
      }));
    },
  } satisfies Calc<R>;

  const calcStore = store as CreatedStore<R> & Calc<R>;
  calcStore.calcWarm = calc.calcWarm;
  calcStore.readCalcValues = calc.readCalcValues;

  const profileFingerprints = Object.fromEntries(
    opts.calc.bindings.flatMap((binding) => {
      const fingerprint = (binding.profile as CompiledProfile).schemaIdentity
        ?.fingerprint;
      return typeof fingerprint === "string"
        ? [[binding.rootTypeName, fingerprint]]
        : [];
    }),
  );
  store.capabilities.calc = true;
  store.capabilities.profiles = {
    ...store.capabilities.profiles,
    calc: {
      rootTypes: opts.calc.bindings.map((binding) => binding.rootTypeName),
      profileFingerprints,
    },
  };
}
