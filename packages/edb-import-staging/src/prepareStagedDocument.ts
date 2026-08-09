/** Singular JSON Schema $ref fields in the import-demo model. */
const SINGULAR_REF_FIELDS = new Set(["parent", "location", "birthPlace"]);

const truncate = (value: unknown, maxLength: number): unknown => {
  if (typeof value !== "string" || value.length <= maxLength) return value;
  return value.slice(0, maxLength);
};

const isEntityRef = (value: unknown): value is { "@id": string } =>
  Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as { ["@id"]?: string })["@id"] === "string",
  );

/** Keep only `@id` so upsert links to already-applied entities (no blank nodes). */
const toIdOnlyRef = (value: { "@id": string }): { "@id": string } => ({
  "@id": value["@id"],
});

const collapseEntityRefs = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => (isEntityRef(item) ? toIdOnlyRef(item) : item));
  }
  if (isEntityRef(value)) {
    return toIdOnlyRef(value);
  }
  return value;
};

/**
 * Prepare a staged document for persistence: unwrap single-element ref arrays,
 * collapse nested entity objects to `{@id}`, promote authority id → `sameAs`,
 * truncate overlong strings, and drop mapping-only metadata fields.
 */
export const prepareStagedDocument = (
  document: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...document };

  for (const field of SINGULAR_REF_FIELDS) {
    const value = result[field];
    if (Array.isArray(value) && value.length === 1 && isEntityRef(value[0])) {
      result[field] = value[0];
    }
  }

  for (const [key, value] of Object.entries(result)) {
    if (key.startsWith("@") || key === "idAuthority") continue;
    result[key] = collapseEntityRefs(value);
  }

  // Prior pattern: strategies carry `idAuthority`; geo (and similar) persist the
  // Wikidata/authority URL on `sameAs` (schema field). Do not backfill missing
  // sameAs when already set (e.g. root import inject).
  const idAuthority = result.idAuthority;
  if (
    result.sameAs == null &&
    idAuthority &&
    typeof idAuthority === "object" &&
    typeof (idAuthority as { id?: unknown }).id === "string"
  ) {
    result.sameAs = (idAuthority as { id: string }).id;
  }

  if ("title" in result) result.title = truncate(result.title, 200);
  if ("titleVariants" in result)
    result.titleVariants = truncate(result.titleVariants, 600);
  if ("name" in result) result.name = truncate(result.name, 200);

  delete result.idAuthority;
  delete result.lastNormUpdate;
  delete result.__draft;

  return result;
};
