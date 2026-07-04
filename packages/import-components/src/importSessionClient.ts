import { restApiBase } from "./importSessionTypes";
import type {
  ProvenanceEnvelope,
  StrategyTrace,
} from "@graviola/edb-import-staging";

const API_ROOT = `${restApiBase}/api/graviola`;

export type StagedEntitySummary = {
  entityIRI: string;
  typeIRI: string;
  typeName: string;
  label: string;
  reviewState: "pending" | "accepted" | "rejected";
  depth: number;
  parentIRI?: string;
  provenance: ProvenanceEnvelope;
  trace: StrategyTrace;
};

export type StagedSessionPayload = {
  entities: StagedEntitySummary[];
  tree: string;
  total: number;
};

export type BatchImportResult = StagedSessionPayload & {
  imported: number;
  failed: number;
  totalMs?: number;
  results: Array<{
    typeName: string;
    authorityIRI: string;
    ok: boolean;
    staged?: number;
    error?: string;
    ms?: number;
  }>;
};

type ProblemBody = {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
};

async function sessionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_ROOT}/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const problem = (await res.json()) as ProblemBody;
      detail = problem.detail ?? problem.title ?? detail;
    } catch {
      // ignore
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function createImportSession(): Promise<{
  sessionId: string;
  sessionIRI: string;
}> {
  return sessionFetch("_sessions", { method: "POST" });
}

export async function importFromAuthority(
  sessionId: string,
  typeName: string,
  authorityIRI: string,
): Promise<StagedSessionPayload & { staged: number; rootEntityIRI?: string }> {
  return sessionFetch(`_sessions/${sessionId}/import-from-authority`, {
    method: "POST",
    body: JSON.stringify({ typeName, authorityIRI }),
  });
}

export async function importBatch(
  sessionId: string,
  authorityIRIs: string[],
  typeName = "Person",
): Promise<BatchImportResult> {
  return sessionFetch(`_sessions/${sessionId}/import-batch`, {
    method: "POST",
    body: JSON.stringify({ typeName, authorityIRIs }),
  });
}

export async function listStagedSession(
  sessionId: string,
): Promise<StagedSessionPayload> {
  return sessionFetch(`_sessions/${sessionId}/staged`);
}

export async function getStagedEntity(
  sessionId: string,
  entityIRI: string,
): Promise<StagedEntitySummary & { document: Record<string, unknown> }> {
  const params = new URLSearchParams({ iri: entityIRI });
  return sessionFetch(`_sessions/${sessionId}/entity?${params}`);
}

export async function setStagedReviewState(
  sessionId: string,
  entityIRI: string,
  reviewState: StagedEntitySummary["reviewState"],
): Promise<void> {
  await sessionFetch(`_sessions/${sessionId}/entity`, {
    method: "PATCH",
    body: JSON.stringify({ entityIRI, reviewState }),
  });
}

export async function applyImportSession(
  sessionId: string,
): Promise<{ applied: string[] }> {
  return sessionFetch(`_sessions/${sessionId}/apply`, { method: "POST" });
}

export async function discardImportSession(sessionId: string): Promise<void> {
  await sessionFetch(`_sessions/${sessionId}`, { method: "DELETE" });
}

/** Parse textarea / CSV-ish lines into authority IRIs (bare Q-IDs allowed). */
export function parseAuthorityLines(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
