import type { CompiledProfile } from "@graviola/formula-dependency";
import type { JSONSchema7 } from "json-schema";

/** Schema extension carried on calculated properties for structural dispatch. */
export type CalcSchemaAnnotation = {
  scope: string;
  stratum: number;
  formula?: string;
  aggregate?: { type: string; over: string; field?: string };
  /** Presentation hint supplied when annotating from the calc profile. */
  display?: "currency" | "area" | "number";
};

export const X_CALC = "x-calc" as const;

export type JSONSchema7WithCalc = JSONSchema7 & {
  [X_CALC]?: CalcSchemaAnnotation;
};

export type AnnotateCalcSchemaOptions = {
  /** Scope → display hint (profile authoring, not renderer property-name matching). */
  displayByScope?: Record<string, CalcSchemaAnnotation["display"]>;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Annotate domain schema properties that appear in a compiled calc profile
 * with {@link X_CALC} so DetailRenderer testers can dispatch without hardcoding names.
 */
export function annotateCalcSchema(
  schema: JSONSchema7,
  profile: CompiledProfile,
  options?: AnnotateCalcSchemaOptions,
): JSONSchema7 {
  const out = cloneJson(schema);
  const definitions = out.definitions ?? {};

  for (const [scope, slot] of Object.entries(profile.slots)) {
    const defName = slot.entityScope.match(/\/definitions\/([^/]+)$/)?.[1];
    if (!defName) continue;
    const def = definitions[defName] as JSONSchema7 | undefined;
    if (!def?.properties?.[slot.propertyName]) continue;

    const prop = def.properties[slot.propertyName] as JSONSchema7WithCalc;
    prop[X_CALC] = {
      scope,
      stratum: slot.stratum,
      formula: slot.formula,
      aggregate: slot.aggregate,
      display: options?.displayByScope?.[scope] ?? "number",
    };
    prop.readOnly = true;
  }

  return out;
}

export function isCalcAnnotatedSchema(
  schema: JSONSchema7 | undefined,
): schema is JSONSchema7WithCalc {
  return Boolean(
    schema &&
    typeof schema === "object" &&
    (schema as JSONSchema7WithCalc)[X_CALC],
  );
}
