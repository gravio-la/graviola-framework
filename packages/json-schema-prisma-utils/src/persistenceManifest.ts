/**
 * Persistence representation of a JSON Schema property in the generated Prisma schema.
 * Selected by databaseProvider (and optional listRepresentation override).
 */
export type PersistenceRepresentation =
  | "childTable"
  | "scalarList"
  | "embedded"
  | "relationM2M"
  | "relationToOne"
  | "flattened"
  | "scalar";

export type PersistencePropertyDescriptor = {
  representation: PersistenceRepresentation;
  /** Prisma child model name when representation is childTable */
  childModel?: string;
  /** Primitive value column type for childTable of primitives */
  valueType?: "String" | "Int" | "Float" | "Boolean";
  /** Parent FK field name on the child model (e.g. Item_id) */
  parentFk?: string;
  /** Parent relation field name on the child (e.g. Item) */
  parentRelation?: string;
  /** Nested property descriptors (anonymous object fields / nested lists) */
  properties?: Record<string, PersistencePropertyDescriptor>;
};

export type PersistenceTypeManifest = Record<
  string,
  PersistencePropertyDescriptor
>;

export type PersistenceManifest = {
  /** Prisma datasource provider used when generating */
  databaseProvider: "sqlite" | "postgresql" | "mysql" | "mongodb" | string;
  /** Per typeName → property → descriptor */
  types: Record<string, PersistenceTypeManifest>;
};

export type JsonSchema2PrismaResult = {
  schemaText: string;
  manifest: PersistenceManifest;
};
