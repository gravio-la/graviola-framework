import type { SchemaIdentity } from "@graviola/json-schema-utils";

export type SidecarAppliesTo = SchemaIdentity;

/**
 * Scope-keyed companion envelope shared by calc profiles, lens sets, and similar
 * artifacts. Each concern defines its own `$schema` IRI and slot payload shape
 * (e.g. `calc-profile/v1`, `lens/v1`) — there is no global sidecar schema.
 *
 * UI schema (JSON Forms) and MetaSchema profiles are different document families;
 * they are orthogonal companions in the architectural sense but do not use this
 * envelope.
 */
export type SidecarDocument<TPayload = unknown> = {
  /** Concern-specific document schema IRI, set by the owning package. */
  $schema?: string;
  appliesTo: SidecarAppliesTo;
  slots: Record<string, TPayload>;
};

export type SidecarValidationIssue =
  | {
      kind: "fingerprint-mismatch";
      expected: string;
      actual: string;
      version?: string;
    }
  | {
      kind: "dangling-scope";
      scope: string;
      message: string;
    }
  | {
      kind: "invalid-payload";
      scope: string;
      message: string;
    }
  | {
      kind: "version-content-drift";
      message: string;
    };

export type SidecarValidationResult = {
  valid: boolean;
  issues: SidecarValidationIssue[];
};

export type SidecarPayloadValidator<TPayload = unknown> = (
  scope: string,
  payload: TPayload,
) => string | undefined;

export function formatAppliesToLabel(appliesTo: SidecarAppliesTo): string {
  const versionPart = appliesTo.version ? ` v${appliesTo.version}` : "";
  const schemaPart = appliesTo.schema ?? "(anonymous schema)";
  return `${schemaPart}${versionPart} (${appliesTo.fingerprint})`;
}

/**
 * Resolve a sidecar slot payload by JSON Pointer scope.
 */
export function resolveSidecarSlot<TPayload>(
  sidecar: SidecarDocument<TPayload>,
  scope: string,
): TPayload | undefined {
  return sidecar.slots[scope];
}

/**
 * Validate sidecar against a schema identity and known scopes.
 * Payload validation is optional via {@link SidecarPayloadValidator}.
 */
export function validateSidecar<TPayload>(
  sidecar: SidecarDocument<TPayload>,
  expectedIdentity: SchemaIdentity,
  knownScopes: string[],
  validatePayload?: SidecarPayloadValidator<TPayload>,
): SidecarValidationResult {
  const issues: SidecarValidationIssue[] = [];
  const known = new Set(knownScopes);

  const fingerprintMismatch =
    sidecar.appliesTo.fingerprint !== expectedIdentity.fingerprint;
  const versionContentDrift =
    fingerprintMismatch &&
    sidecar.appliesTo.version &&
    expectedIdentity.version &&
    sidecar.appliesTo.version === expectedIdentity.version;

  if (versionContentDrift) {
    issues.push({
      kind: "version-content-drift",
      message: `Sidecar targets version ${sidecar.appliesTo.version} but fingerprint does not match ${formatAppliesToLabel(expectedIdentity)}`,
    });
  } else if (fingerprintMismatch) {
    issues.push({
      kind: "fingerprint-mismatch",
      expected: expectedIdentity.fingerprint,
      actual: sidecar.appliesTo.fingerprint,
      version: sidecar.appliesTo.version,
    });
  }

  for (const scope of Object.keys(sidecar.slots)) {
    if (!known.has(scope)) {
      issues.push({
        kind: "dangling-scope",
        scope,
        message: `Dangling sidecar scope ${scope} — not found in schema ${formatAppliesToLabel(expectedIdentity)}`,
      });
    }
    if (validatePayload) {
      const err = validatePayload(scope, sidecar.slots[scope]);
      if (err) {
        issues.push({
          kind: "invalid-payload",
          scope,
          message: err,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Build a scope-keyed companion document. The caller must supply the
 * concern-specific `$schema` IRI (from the owning package, not from here).
 */
export function createSidecarDocument<TPayload>(
  documentSchema: string,
  appliesTo: SchemaIdentity,
  slots: Record<string, TPayload> = {},
): SidecarDocument<TPayload> {
  return {
    $schema: documentSchema,
    appliesTo,
    slots,
  };
}
