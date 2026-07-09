import type { SchemaIdentity } from "@graviola/json-schema-utils";

export const SIDECAR_SCHEMA_IRI = "https://graviola.top/sidecar/v1";

export type SidecarAppliesTo = SchemaIdentity & {
  /** Sidecar format version IRI (document `$schema`). */
  sidecarSchema?: string;
};

export type SidecarDocument<TPayload = unknown> = {
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

  if (sidecar.appliesTo.fingerprint !== expectedIdentity.fingerprint) {
    issues.push({
      kind: "fingerprint-mismatch",
      expected: expectedIdentity.fingerprint,
      actual: sidecar.appliesTo.fingerprint,
      version: sidecar.appliesTo.version,
    });
  }

  if (
    sidecar.appliesTo.version &&
    expectedIdentity.version &&
    sidecar.appliesTo.version === expectedIdentity.version &&
    sidecar.appliesTo.fingerprint !== expectedIdentity.fingerprint
  ) {
    issues.push({
      kind: "version-content-drift",
      message: `Sidecar targets version ${sidecar.appliesTo.version} but fingerprint does not match ${formatAppliesToLabel(expectedIdentity)}`,
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
          kind: "dangling-scope",
          scope,
          message: err,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

export function createSidecarDocument<TPayload>(
  appliesTo: SchemaIdentity,
  slots: Record<string, TPayload> = {},
): SidecarDocument<TPayload> {
  return {
    $schema: SIDECAR_SCHEMA_IRI,
    appliesTo,
    slots,
  };
}
