import type { DataSource } from "./types";

export type FetchProvenance = {
  sourceId: string;
  kind: DataSource["kind"];
  endpoint: string;
  request: { summary: string; hash: string; body?: string };
  requestedAt: string;
  durationMs: number;
  cache: "hit" | "miss" | "refresh" | "offline-hit" | "disabled";
  attempts: number;
  httpStatus?: number;
  pages?: number;
  detail?: Record<string, unknown>;
  license?: string;
};

export type FetchResult<T = unknown> =
  | { ok: true; items: T[]; raw: unknown; provenance: FetchProvenance }
  | {
      ok: false;
      error: { message: string; retryable: boolean; cause?: unknown };
      provenance: FetchProvenance;
    };

export type Evidence<T = unknown> = {
  subject: string;
  field: string;
  value: T;
  provenance: FetchProvenance;
  rank?: number;
  note?: string;
};

export const hashRequest = async (
  summary: string,
  body?: string,
): Promise<string> => {
  const payload = body ? `${summary}\n${body}` : summary;
  const data = new TextEncoder().encode(payload);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  }
  // Fallback for environments without subtle crypto
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(16)}`;
};
