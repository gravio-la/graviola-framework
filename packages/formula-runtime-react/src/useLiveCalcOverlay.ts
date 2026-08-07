import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash-es/debounce";
import isEqual from "lodash-es/isEqual";
import type { CompiledProfile } from "@graviola/formula-dependency";
import {
  BROWSER_FORM_HOST,
  evaluateCompiledProfile,
  type CalcHostCapabilities,
  type FormulaEvaluationResult,
} from "@graviola/formula-runtime";
import { partitionLiveSlots } from "./overlayCore";

export type UseLiveCalcOverlayOptions = {
  /** Capability context gating which slots evaluate live. */
  host?: CalcHostCapabilities;
  /**
   * Trailing debounce for recomputation. Default 0 (synchronous) — the
   * overlay then always reflects the current form data, which is required
   * when the result is fed back into a controlled form. Use a positive value
   * only for expensive profiles whose result is displayed outside the form
   * input path (the overlay lags the data by up to `debounceMs`).
   */
  debounceMs?: number;
};

export type UseLiveCalcOverlayResult = {
  /** Form data with live-evaluable computed values written in (display only). */
  data: Record<string, unknown>;
  /** Root-owned computed values (propertyName → value). */
  computed: Record<string, unknown>;
  /**
   * Slot scopes excluded from live evaluation by the host's capability
   * context (cost above `maxLiveCost` or `eval: "server"`). Their values are
   * not in `data` — they are computed on the server / at warm time.
   */
  skippedSlots: string[];
};

/**
 * Live-overlay evaluation for forms: cost-gates the profile with
 * `selectLiveEvalSlots`, then re-evaluates the allowed slots as form data
 * changes. Deep-equal results keep the previous object identity, so feeding
 * `data` back into a controlled form cannot produce an update loop. Values
 * are a display overlay — the persist boundary strips `x-calc` properties,
 * so overlay values are never written as user input.
 */
export function useLiveCalcOverlay(
  profile: CompiledProfile | undefined,
  formData: Record<string, unknown> | undefined,
  options: UseLiveCalcOverlayOptions = {},
): UseLiveCalcOverlayResult {
  const { host = BROWSER_FORM_HOST, debounceMs = 0 } = options;

  const partition = useMemo(
    () => (profile ? partitionLiveSlots(profile, host) : undefined),
    [profile, host],
  );
  const liveProfile = partition?.liveProfile;
  const skippedSlots = partition?.skippedSlots ?? [];
  const active =
    liveProfile !== undefined &&
    Object.keys(liveProfile.slots).length > 0 &&
    formData !== undefined;

  // Stable-reference cache: identical evaluation results reuse the previous
  // object so consumers (and controlled forms) see an unchanged reference.
  const cache = useRef<FormulaEvaluationResult | undefined>(undefined);
  const remember = (next: FormulaEvaluationResult): FormulaEvaluationResult => {
    if (cache.current && isEqual(cache.current, next)) return cache.current;
    cache.current = next;
    return next;
  };

  const syncResult = useMemo(() => {
    if (!active || debounceMs > 0) return undefined;
    return remember(evaluateCompiledProfile(liveProfile!, formData!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, debounceMs, liveProfile, formData]);

  const [lagged, setLagged] = useState<FormulaEvaluationResult | undefined>(
    undefined,
  );
  const latest = useRef({ liveProfile, formData });
  latest.current = { liveProfile, formData };

  const runDebounced = useMemo(() => {
    if (debounceMs <= 0) return undefined;
    return debounce(() => {
      const { liveProfile: lp, formData: fd } = latest.current;
      if (!lp || !fd) return;
      const next = remember(evaluateCompiledProfile(lp, fd));
      setLagged((prev) => (prev === next ? prev : next));
    }, debounceMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceMs]);

  useEffect(() => {
    if (!active || !runDebounced) return;
    runDebounced();
    return () => {
      runDebounced.cancel();
    };
  }, [active, runDebounced, liveProfile, formData]);

  if (!active) {
    return { data: formData ?? {}, computed: {}, skippedSlots };
  }
  const result = debounceMs > 0 ? lagged : syncResult;
  return {
    data: result?.data ?? formData!,
    computed: result?.computed ?? {},
    skippedSlots,
  };
}
