import type { AbstractDatastore } from "@graviola/edb-global-types";
import {
  createStagedChangeSet,
  type StagedChangeSet,
} from "@graviola/edb-import-staging";
import {
  jsonResponse,
  problemResponse,
  type ExtensionRoute,
} from "@graviola/rest-store-server";
import {
  BASE_IRI,
  primaryFields,
  typeIRItoTypeName,
} from "@graviola/edb-import-demo-schema";
import type { BaseStore } from "@graviola/store-core";
import { formatCreationTreeString, labelFor } from "./formatCreationTreeString";
import { importIntoSession } from "./importPipeline";

const propertyToIRI = (name: string) => `${BASE_IRI}${name}`;

export type ImportSession = {
  sessionId: string;
  sessionIRI: string;
  changeSet: StagedChangeSet;
  createdAt: string;
};

const sessions = new Map<string, ImportSession>();

function sessionNotFound(sessionId: string): Response {
  return problemResponse(
    404,
    "session_not_found",
    "Import session not found",
    `No session with id "${sessionId}"`,
  );
}

function getSession(sessionId: string): ImportSession | undefined {
  return sessions.get(sessionId);
}

function createSession(): ImportSession {
  const sessionId = crypto.randomUUID();
  const sessionIRI = `urn:graviola:import-session:${sessionId}`;
  const changeSet = createStagedChangeSet({
    propertyToIRI,
    changeSetIRI: sessionIRI,
  });
  const session: ImportSession = {
    sessionId,
    sessionIRI,
    changeSet,
    createdAt: new Date().toISOString(),
  };
  sessions.set(sessionId, session);
  return session;
}

async function readJsonBody<T>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text) as T;
}

/**
 * Expand shorthand authority identifiers to full entity IRIs.
 * - Bare Q-IDs ("Q5879") → Wikidata entity IRIs
 * - `gnd:<ID>` → SLUB LOD (`https://data.slub-dresden.de/gnd/{id}`)
 * - Full `https?://d-nb.info/gnd/...` URLs are left unchanged (lobid/GND authority)
 */
function normalizeAuthorityIRI(raw: string): string {
  const trimmed = raw.trim();
  if (/^Q\d+$/i.test(trimmed)) {
    return `http://www.wikidata.org/entity/${trimmed.toUpperCase()}`;
  }
  const gndShorthand = /^gnd:([0-9X-]+)$/i.exec(trimmed);
  if (gndShorthand) {
    return `https://data.slub-dresden.de/gnd/${gndShorthand[1]}`;
  }
  return trimmed;
}

function stagedEntitySummary(
  entity: ReturnType<StagedChangeSet["list"]>[number],
) {
  return {
    entityIRI: entity.entityIRI,
    typeIRI: entity.typeIRI,
    typeName: typeIRItoTypeName(entity.typeIRI),
    label: labelFor(entity, typeIRItoTypeName, primaryFields),
    reviewState: entity.reviewState,
    depth: entity.depth,
    parentIRI: entity.parentIRI,
    provenance: entity.provenance,
    trace: entity.trace,
  };
}

function stagedPayload(session: ImportSession) {
  const entities = session.changeSet.list().map(stagedEntitySummary);
  const tree = formatCreationTreeString(session.changeSet, {
    typeIRItoTypeName,
    primaryFields,
  });
  return { entities, tree, total: entities.length };
}

export function createSessionRoutes(
  abstractDatastore: AbstractDatastore,
  store: BaseStore<Record<string, unknown>>,
): ExtensionRoute[] {
  return [
    {
      method: "POST",
      path: "_sessions",
      handler: async () => {
        const session = createSession();
        return jsonResponse({
          sessionId: session.sessionId,
          sessionIRI: session.sessionIRI,
        });
      },
    },
    {
      method: "POST",
      path: "_sessions/:sessionId/import-from-authority",
      handler: async (req, params) => {
        const session = getSession(params.sessionId);
        if (!session) return sessionNotFound(params.sessionId);

        let body: { typeName?: string; authorityIRI?: string };
        try {
          body = await readJsonBody(req);
        } catch {
          return problemResponse(400, "invalid_json", "Invalid JSON body");
        }

        const { typeName, authorityIRI } = body;
        if (!typeName || !authorityIRI) {
          return problemResponse(
            400,
            "invalid_request",
            "Missing required fields",
            "Body must include typeName and authorityIRI",
          );
        }

        try {
          const { rootIRI, staged } = await importIntoSession({
            changeSet: session.changeSet,
            dataStore: abstractDatastore,
            typeName,
            authorityEntityIRI: normalizeAuthorityIRI(authorityIRI),
          });
          const payload = stagedPayload(session);
          return jsonResponse({ staged, rootEntityIRI: rootIRI, ...payload });
        } catch (err) {
          const detail = err instanceof Error ? err.message : "Import failed";
          return problemResponse(500, "import_failed", "Import failed", detail);
        }
      },
    },
    {
      method: "POST",
      path: "_sessions/:sessionId/import-batch",
      handler: async (req, params) => {
        const session = getSession(params.sessionId);
        if (!session) return sessionNotFound(params.sessionId);

        let body: {
          typeName?: string;
          authorityIRIs?: string[];
          items?: Array<{ typeName?: string; authorityIRI?: string }>;
        };
        try {
          body = await readJsonBody(req);
        } catch {
          return problemResponse(400, "invalid_json", "Invalid JSON body");
        }

        const entries: Array<{ typeName: string; authorityIRI: string }> = [];
        const defaultType = body.typeName ?? "Person";

        if (Array.isArray(body.items) && body.items.length > 0) {
          for (const item of body.items) {
            if (!item.authorityIRI?.trim()) continue;
            entries.push({
              typeName: item.typeName?.trim() || defaultType,
              authorityIRI: normalizeAuthorityIRI(item.authorityIRI),
            });
          }
        } else if (Array.isArray(body.authorityIRIs)) {
          for (const raw of body.authorityIRIs) {
            if (!raw?.trim()) continue;
            entries.push({
              typeName: defaultType,
              authorityIRI: normalizeAuthorityIRI(raw),
            });
          }
        }

        if (entries.length === 0) {
          return problemResponse(
            400,
            "invalid_request",
            "Missing import entries",
            "Body must include authorityIRIs[] or items[] with at least one authorityIRI",
          );
        }

        const results: Array<{
          typeName: string;
          authorityIRI: string;
          ok: boolean;
          staged?: number;
          error?: string;
          ms?: number;
        }> = [];

        const batchStartedAt = performance.now();

        for (let index = 0; index < entries.length; index += 1) {
          const entry = entries[index]!;
          if (index > 0 && entry.authorityIRI.includes("wikidata.org")) {
            // Gentle pacing — Wikidata maxlag after deep recursive imports.
            await new Promise((resolve) => setTimeout(resolve, 750));
          }
          const entryStartedAt = performance.now();
          try {
            const { staged } = await importIntoSession({
              changeSet: session.changeSet,
              dataStore: abstractDatastore,
              typeName: entry.typeName,
              authorityEntityIRI: entry.authorityIRI,
            });
            results.push({
              typeName: entry.typeName,
              authorityIRI: entry.authorityIRI,
              ok: true,
              staged,
              ms: Math.round(performance.now() - entryStartedAt),
            });
          } catch (err) {
            results.push({
              typeName: entry.typeName,
              authorityIRI: entry.authorityIRI,
              ok: false,
              error: err instanceof Error ? err.message : "Import failed",
              ms: Math.round(performance.now() - entryStartedAt),
            });
          }
        }

        const payload = stagedPayload(session);
        return jsonResponse({
          imported: results.filter((r) => r.ok).length,
          failed: results.filter((r) => !r.ok).length,
          totalMs: Math.round(performance.now() - batchStartedAt),
          results,
          ...payload,
        });
      },
    },
    {
      method: "GET",
      path: "_sessions/:sessionId/staged",
      handler: async (_req, params) => {
        const session = getSession(params.sessionId);
        if (!session) return sessionNotFound(params.sessionId);
        return jsonResponse(stagedPayload(session));
      },
    },
    {
      method: "GET",
      path: "_sessions/:sessionId/entity",
      handler: async (req, params) => {
        const session = getSession(params.sessionId);
        if (!session) return sessionNotFound(params.sessionId);

        const entityIRI = req.url
          ? new URL(req.url).searchParams.get("iri")
          : null;
        if (!entityIRI) {
          return problemResponse(
            400,
            "invalid_request",
            "Missing iri query parameter",
          );
        }

        const entity = session.changeSet.get(entityIRI);
        if (!entity) {
          return problemResponse(
            404,
            "entity_not_found",
            "Staged entity not found",
            entityIRI,
          );
        }

        return jsonResponse({
          ...stagedEntitySummary(entity),
          document: entity.document,
        });
      },
    },
    {
      method: "PATCH",
      path: "_sessions/:sessionId/entity",
      handler: async (req, params) => {
        const session = getSession(params.sessionId);
        if (!session) return sessionNotFound(params.sessionId);

        let body: { entityIRI?: string; reviewState?: string };
        try {
          body = await readJsonBody(req);
        } catch {
          return problemResponse(400, "invalid_json", "Invalid JSON body");
        }

        const { entityIRI, reviewState } = body;
        if (!entityIRI || !reviewState) {
          return problemResponse(
            400,
            "invalid_request",
            "Missing entityIRI or reviewState",
          );
        }
        if (
          reviewState !== "pending" &&
          reviewState !== "accepted" &&
          reviewState !== "rejected"
        ) {
          return problemResponse(400, "invalid_request", "Invalid reviewState");
        }

        try {
          session.changeSet.setReviewState(entityIRI, reviewState);
        } catch (err) {
          const detail =
            err instanceof Error ? err.message : "Review update failed";
          return problemResponse(404, "entity_not_found", detail);
        }

        return jsonResponse({ entityIRI, reviewState });
      },
    },
    {
      method: "POST",
      path: "_sessions/:sessionId/apply",
      handler: async (_req, params) => {
        const session = getSession(params.sessionId);
        if (!session) return sessionNotFound(params.sessionId);

        try {
          const appliedIRIs = await session.changeSet.applyAll(
            {
              upsert: (entityTypeName, entityIRI, document) =>
                store.upsert(entityTypeName, entityIRI, document),
            },
            typeIRItoTypeName,
          );
          sessions.delete(params.sessionId);
          return jsonResponse({ applied: appliedIRIs });
        } catch (err) {
          const detail =
            err instanceof Error
              ? err.cause instanceof Error
                ? `${err.message}: ${err.cause.message}`
                : err.message
              : "Apply failed";
          return problemResponse(500, "apply_failed", "Apply failed", detail);
        }
      },
    },
    {
      method: "DELETE",
      path: "_sessions/:sessionId",
      handler: async (_req, params) => {
        const session = getSession(params.sessionId);
        if (!session) return sessionNotFound(params.sessionId);

        session.changeSet.discard();
        sessions.delete(params.sessionId);
        return jsonResponse({ discarded: true });
      },
    },
  ];
}
