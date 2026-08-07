import {
  gardenFeeSchema,
  gardenFeeSidecar,
  gardenFeeStatementPolicies,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import {
  createStoreFromEnv,
  type CreateStoreResult,
} from "@graviola/store-factory";

/**
 * Reference calc-tier deployment: garden-fee domain schema, all four formula
 * outputs materialized (`gardenFeeStatementPolicies`), root type `Garden`.
 *
 * Backend is env-driven via `@graviola/store-factory` (`GRAVIOLA_STORE`,
 * default `oxigraph` — in-process, no external service). Prisma+Postgres is
 * the documented reference deployment (`GRAVIOLA_STORE=prisma` +
 * `DATABASE_URL`); this app does not ship its own Prisma migration for the
 * garden-fee schema — point it at a database already migrated for that shape.
 */
export const GARDEN_FEE_BASE_IRI = "https://example.org/";

export const gardenFeeTypeNameToTypeIRI = (typeName: string): string =>
  `${GARDEN_FEE_BASE_IRI}${typeName}`;

export const gardenFeeTypeIRItoTypeName = (iri: string): string =>
  iri.replace(GARDEN_FEE_BASE_IRI, "");

export const TYPE_NAMES = Object.keys(gardenFeeSchema.definitions ?? {});

export const gardenFeeCalcProfile = compileCalcProfile(
  gardenFeeSidecar,
  gardenFeeSchema,
);

export function createGardenFeeStore(): Promise<CreateStoreResult> {
  return createStoreFromEnv({
    schema: gardenFeeSchema,
    defaultPrefix: GARDEN_FEE_BASE_IRI,
    typeNameToTypeIRI: gardenFeeTypeNameToTypeIRI,
    typeIRItoTypeName: gardenFeeTypeIRItoTypeName,
    primaryFields: { Garden: { label: "name" } },
    statementMeta: { policies: gardenFeeStatementPolicies },
    calc: {
      profile: gardenFeeCalcProfile,
      domainSchema: gardenFeeSchema,
      rootTypeName: "Garden",
      agent: "https://graviola.dev/agents/calc-worker",
    },
  });
}

export { gardenFeeSchema };
