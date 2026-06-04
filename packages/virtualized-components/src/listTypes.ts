/** How a semantic list resolves entity types for each row. */
export type ListTypeMode =
  | { kind: "known"; typeName: string; typeIRI?: string }
  | { kind: "detect" };
