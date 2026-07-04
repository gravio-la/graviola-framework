import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import type { CardActionDef } from "@graviola/edb-core-types";

import type {
  CardActionEntry,
  DetailTesterContext,
  ResolvedCardAction,
} from "../types";

const TESTER_NOT_APPLICABLE = -1;

/**
 * Evaluate all registry entries against schema+data.
 * Returns ranked applicable actions (highest rank first).
 */
export function selectCardActions(
  registry: CardActionEntry[],
  schema: JSONSchema7,
  data: unknown,
  ctx: DetailTesterContext,
): ResolvedCardAction[] {
  if (!registry.length) return [];

  const uischema = { type: "Control", scope: "#" } as ControlElement;
  const testerCtx = {
    rootSchema: ctx.rootSchema as JsonSchema,
    config: ctx,
  };

  const ranked: Array<{ rank: number; resolved: ResolvedCardAction }> = [];

  for (const entry of registry) {
    const rank = entry.tester(
      uischema as never,
      schema as unknown as JsonSchema,
      testerCtx as never,
    );
    if (rank <= TESTER_NOT_APPLICABLE) continue;

    const def = entry.computeAction(schema, data);
    if (!def) continue;

    ranked.push({
      rank,
      resolved: { def, entry },
    });
  }

  ranked.sort((a, b) => b.rank - a.rank);
  return ranked.map((r) => r.resolved);
}

/** Map declared {@link CardActionDef}s from cardPresentation to resolved actions. */
export function declaredCardActions(
  actions: CardActionDef[] | undefined,
): ResolvedCardAction[] {
  return (actions ?? []).map((def) => ({ def, entry: null }));
}
