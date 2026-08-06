import type { StatementPolicyMap } from "@graviola/statement-meta";

/** Annotate Item.price in contract tests (numeric primitive on test schema). */
export const statementTestPolicies: StatementPolicyMap = {
  "Item.price": "always",
};

export const sparqlStatementNodeMetaConfig = {
  policies: statementTestPolicies,
  encoding: "statement-node" as const,
};

export const sparqlStatementRdf12MetaConfig = {
  policies: statementTestPolicies,
  encoding: "rdf-12" as const,
};

export const prismaStatementMetaConfig = {
  policies: statementTestPolicies,
};
