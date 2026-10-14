/** JSON Forms layout `options.detail` / hero IRI placement for TopLevelLayout. */
export type DetailLayoutUiOptions = {
  maxWidth?: string | "none";
  showIri?: "footer" | "title" | "none";
};

export function readDetailLayoutOptions(
  options: Record<string, unknown> | undefined,
): DetailLayoutUiOptions {
  const detail = options?.detail;
  const hero = options?.hero;
  const fromDetail =
    detail && typeof detail === "object"
      ? (detail as DetailLayoutUiOptions)
      : {};
  const showIriFromHero =
    hero && typeof hero === "object"
      ? (hero as { showIri?: DetailLayoutUiOptions["showIri"] }).showIri
      : undefined;
  return {
    maxWidth: fromDetail.maxWidth,
    showIri: fromDetail.showIri ?? showIriFromHero ?? "footer",
  };
}

export function detailContentMaxWidthSx(
  maxWidth: string | "none" | undefined,
): { maxWidth?: string; mx?: string; width?: string } {
  if (maxWidth === "none") return {};
  const w = maxWidth ?? "80ch";
  return { maxWidth: w, mx: "auto", width: "100%" };
}
