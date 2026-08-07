import type { JSONSchema7 } from "json-schema";
import cloneDeep from "lodash-es/cloneDeep";
import { X_CALC, schemaIdentityOfSync } from "@graviola/json-schema-utils";
import type { CompiledProfile, CostHint } from "./types";
import { CalcProfileCompileError } from "./types";

/** Value written under the `x-calc` key of an annotated property node. */
export type XCalcAnnotation = {
  /** Slot scope — doubles as the formula id used in provenance. */
  formulaId: string;
  stratum: number;
  cost: CostHint;
  eval?: "client" | "server" | "auto";
  cache?: string;
};

function scopeToSegments(scope: string): string[] {
  return scope
    .replace(/^#\//, "")
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

/**
 * Mark every compiled calc slot's target property in the domain schema with
 * `x-calc` (+ `readOnly: true`), so renderers can tell computed fields apart
 * and `stripXCalcProperties` removes overlay values before persist.
 *
 * Pure and idempotent — returns a new schema, the input is not mutated.
 *
 * Ordering caveat: annotation changes the schema's content fingerprint.
 * Always compile (and validate sidecars) against the **raw** schema; use the
 * annotated schema only for rendering and the persist boundary.
 *
 * @throws CalcProfileCompileError `fingerprint-mismatch` when the profile was
 *   compiled for a different schema, `dangling-scope` when a slot scope does
 *   not resolve to a property node (cannot happen for a profile compiled
 *   against this schema).
 */
export function annotateCalcSchema(
  schema: JSONSchema7,
  profile: CompiledProfile,
): JSONSchema7 {
  const identity = schemaIdentityOfSync(schema);
  if (
    profile.schemaIdentity.fingerprint &&
    identity.fingerprint !== profile.schemaIdentity.fingerprint
  ) {
    throw new CalcProfileCompileError([
      {
        kind: "fingerprint-mismatch",
        expected: profile.schemaIdentity.fingerprint,
        actual: identity.fingerprint,
        message: `Compiled profile targets schema ${profile.schemaIdentity.fingerprint} but annotateCalcSchema received ${identity.fingerprint}`,
      },
    ]);
  }

  const annotated = cloneDeep(schema);

  for (const [scope, slot] of Object.entries(profile.slots)) {
    let node: Record<string, unknown> = annotated as Record<string, unknown>;
    for (const segment of scopeToSegments(scope)) {
      const next = node[segment];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        throw new CalcProfileCompileError([
          {
            kind: "dangling-scope",
            scope,
            message: `annotateCalcSchema: scope ${scope} does not resolve to a property node`,
          },
        ]);
      }
      node = next as Record<string, unknown>;
    }

    const annotation: XCalcAnnotation = {
      formulaId: scope,
      stratum: slot.stratum,
      cost: slot.cost,
      ...(slot.eval ? { eval: slot.eval } : {}),
      ...(slot.cache ? { cache: slot.cache } : {}),
    };
    node[X_CALC] = annotation;
    node.readOnly = true;
  }

  return annotated;
}
