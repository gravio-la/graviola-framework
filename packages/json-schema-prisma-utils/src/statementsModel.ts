/** Generic fact-level statements side table (one per database, all types). */
export const GRAVIOLA_STATEMENTS_MODEL_NAME = "GraviolaStatement";

export function graviolaStatementsModelText(): string {
  return `
model GraviolaStatement {
  id               String    @id
  entityIri        String
  typeName         String
  path             String
  valueHash        String
  valueJson        String
  rank             String?
  source           String?
  generatedAt      DateTime?
  formulaId        String?
  stratum          Int?
  inputFingerprint String?
  agent            String?
  extensionsJson   String?

  @@index([entityIri, path])
}
`;
}
