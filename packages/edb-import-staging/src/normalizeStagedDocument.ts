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

/**
 * Prepare a staged document for persistence: unwrap single-element ref arrays,
 * truncate overlong strings, and drop mapping-only metadata fields.
 */
export const normalizeStagedDocument = (
  document: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...document };

  for (const field of SINGULAR_REF_FIELDS) {
    const value = result[field];
    if (Array.isArray(value) && value.length === 1 && isEntityRef(value[0])) {
      result[field] = value[0];
    }
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
