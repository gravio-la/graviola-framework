import { isSafeIri, InvalidIriError } from "@graviola/edb-core-utils";
import type { StoreDocumentsSearchOptions } from "@graviola/store-core";

import type { StoreCommand } from "./commands.js";

export { InvalidIriError };

const assertSafeEntityIri = (iri: string): void => {
  if (!isSafeIri(iri)) {
    throw new InvalidIriError(iri);
  }
};

const assertSafeEntityIris = (iris: string[]): void => {
  for (const iri of iris) {
    assertSafeEntityIri(iri);
  }
};

const entityIrisFromSearchOptions = (
  options: StoreDocumentsSearchOptions<unknown> | undefined,
): string[] | undefined => {
  if (!options || typeof options !== "object") return undefined;
  const entityIRIs = (options as { entityIRIs?: unknown }).entityIRIs;
  if (!Array.isArray(entityIRIs)) return undefined;
  return entityIRIs.filter((x): x is string => typeof x === "string");
};

/** Validate every IRI-bearing field on a decoded store command. */
export const validateCommandIris = (cmd: StoreCommand): void => {
  switch (cmd.kind) {
    case "loadOne":
    case "exists":
    case "upsert":
    case "remove":
    case "filterOne":
    case "writeStatements":
    case "loadStatements":
      assertSafeEntityIri(cmd.entityIRI);
      break;
    case "resolveTypes":
      assertSafeEntityIri(cmd.entityIRI);
      break;
    case "readCalcValues":
      assertSafeEntityIris(cmd.entityIRIs);
      break;
    case "calcWarm":
      if (cmd.rootIRIs?.length) assertSafeEntityIris(cmd.rootIRIs);
      break;
    case "filterMany":
    case "filterOne":
    case "entitiesWithClasses": {
      const entityIRIs = entityIrisFromSearchOptions(cmd.options);
      if (entityIRIs?.length) assertSafeEntityIris(entityIRIs);
      break;
    }
    default:
      break;
  }
};

export const decodeAndValidateEntityIri = (
  typeName: string,
  segment: string,
  ctx: {
    iriHandling: ("fullIRI" | "localId")[];
    localIdToIri?: (typeName: string, localId: string) => string;
  },
  decodePathSegment: (segment: string) => string,
): string => {
  const localId = decodePathSegment(segment);
  const iri =
    ctx.iriHandling.includes("localId") && ctx.localIdToIri
      ? ctx.localIdToIri(typeName, localId)
      : localId;
  assertSafeEntityIri(iri);
  return iri;
};
