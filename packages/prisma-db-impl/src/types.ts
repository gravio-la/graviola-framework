import type { IRIToStringFn, StringToIRIFn } from "@graviola/edb-core-types";

export type PropertiesAndConnects = {
  id?: string;
  properties: Record<string, any>;
  connects: Record<string, { id: string } | { id: string }[]>;
};
export type CountValue = Record<string, number>;

export type BindingValue = string | number | boolean;

export type PrismaStoreOptions = {
  jsonldContext: any;
  defaultPrefix: string;
  typeNameToTypeIRI: StringToIRIFn;
  typeIRItoTypeName: IRIToStringFn;
  idToIRI?: StringToIRIFn;
  IRItoId?: IRIToStringFn;
  typeIsNotIRI?: boolean;
  allowUnknownNestedElementCreation?: boolean;
  /**
   * Whether to allow update operations to be executed outside of a transaction as a fallback.
   * If datasource provider is MongoDB and it is not running with a replica set, it is not possible to run transactions.
   */
  allowNonTransactionalFallback?: boolean;
  isAllowedNestedElement?: (element: any) => boolean;
  debug?: boolean;
  /**
   * Prisma schema `datasource db { provider = "…" }`
   * Must match the generated client’s datasource.
   */
  datasourceProvider: string;
};
