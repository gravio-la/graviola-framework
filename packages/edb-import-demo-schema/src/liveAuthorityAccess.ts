import type { AuthorityConfiguration } from "@graviola/edb-data-mapping";
import { authorityAccess } from "./mappings/authorityAccess";
import { fixtureAuthorityAccess } from "./fixtureAuthorityAccess";

/**
 * Live authority access (real Wikidata / lobid endpoints) that falls back to
 * the bundled fixtures when the network request fails — so demos and tests
 * keep working offline while real imports hit the live endpoints.
 */
export const liveFirstAuthorityAccess: Record<string, AuthorityConfiguration> =
  Object.fromEntries(
    Object.entries(authorityAccess).map(([key, live]) => [
      key,
      {
        ...live,
        getEntityByIRI: async (iri: string) => {
          try {
            const entity = await live.getEntityByIRI(iri);
            if (entity) return entity;
          } catch (error) {
            console.warn(
              `Live authority fetch failed for ${iri}, trying fixtures:`,
              error instanceof Error ? error.message : error,
            );
          }
          try {
            return await fixtureAuthorityAccess[key]?.getEntityByIRI(iri);
          } catch {
            return null;
          }
        },
      },
    ]),
  );
