export function entityIRIFromRoute(
  entityBaseIRI: string,
  entityIDParam: string | undefined,
): string | undefined {
  if (!entityIDParam) return undefined;
  const decoded = decodeURIComponent(entityIDParam);
  if (decoded.startsWith("http")) return decoded;
  return `${entityBaseIRI}${decoded}`;
}
