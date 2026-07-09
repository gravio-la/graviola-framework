import { useMemo } from "react";
import type { CompiledProfile } from "@graviola/formula-dependency";
import {
  evaluateCompiledProfile,
  type FormulaEvaluationContext,
} from "@graviola/formula-runtime";

export type UseComputedFieldsResult = {
  data: Record<string, unknown>;
  computed: Record<string, unknown>;
};

/**
 * Evaluate a compiled calc profile against entity data.
 * Recomputes when profile or data reference changes.
 */
export function useComputedFields(
  profile: CompiledProfile | undefined,
  data: Record<string, unknown> | undefined,
  context?: FormulaEvaluationContext,
): UseComputedFieldsResult {
  return useMemo(() => {
    if (!profile || !data) {
      return { data: data ?? {}, computed: {} };
    }
    return evaluateCompiledProfile(profile, data, context);
  }, [profile, data, context]);
}
