import type { EntityActionDef } from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";

import type {
  EntityActionContext,
  EntityActionEntry,
  ResolvedEntityAction,
} from "./types";

const TESTER_NOT_APPLICABLE = -1;

function passesSurfaceGate(
  entry: EntityActionEntry,
  surface: EntityActionContext["surface"],
): boolean {
  if (!entry.surfaces?.length) return true;
  return entry.surfaces.includes(surface);
}

function passesCapabilityGate(
  entry: EntityActionEntry,
  ctx: EntityActionContext,
): boolean {
  if (!entry.requiresCapabilities?.length) return true;
  const target = ctx.targets[0];
  return entry.requiresCapabilities.every((cap) =>
    ctx.capabilities.has(cap, target),
  );
}

/**
 * Evaluate registry entries against schema + context.
 * Returns ranked applicable actions (highest rank first).
 */
export function selectEntityActions(
  registry: EntityActionEntry[],
  schema: JSONSchema7,
  ctx: EntityActionContext,
): ResolvedEntityAction[] {
  if (!registry.length) return [];

  const ranked: ResolvedEntityAction[] = [];

  for (const entry of registry) {
    if (!passesSurfaceGate(entry, ctx.surface)) continue;
    if (!passesCapabilityGate(entry, ctx)) continue;

    const rank = entry.tester(schema, ctx);
    if (rank <= TESTER_NOT_APPLICABLE) continue;

    const def = entry.build(ctx);
    if (!def) continue;

    ranked.push({ def, entry, rank });
  }

  ranked.sort((a, b) => b.rank - a.rank);
  return ranked;
}

/** Map declared {@link EntityActionDef}s from presentation config. */
export function declaredEntityActions(
  actions: EntityActionDef[] | undefined,
): ResolvedEntityAction[] {
  return (actions ?? []).map((def) => ({
    def,
    entry: null,
    rank: def.primary ? 100 : 50,
  }));
}

export function splitByImportance(
  actions: ResolvedEntityAction[],
  maxVisible = 2,
): { inline: ResolvedEntityAction[]; overflow: ResolvedEntityAction[] } {
  return {
    inline: actions.slice(0, maxVisible),
    overflow: actions.slice(maxVisible),
  };
}
