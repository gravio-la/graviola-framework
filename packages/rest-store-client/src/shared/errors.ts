export type GraviolaProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  /** Stable machine code — preferred dispatch field */
  code?: string;
  detail?: string;
  instance?: string;
};

export class GraviolaRestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem?: GraviolaProblemDetails;

  constructor(
    message: string,
    status: number,
    code: string,
    problem?: GraviolaProblemDetails,
  ) {
    super(message);
    this.name = "GraviolaRestError";
    this.status = status;
    this.code = code;
    this.problem = problem;
  }
}

export const parseProblemDetailsBody = async (
  res: Response,
): Promise<GraviolaProblemDetails | null> => {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  try {
    const body = await res.clone().json();
    if (body && typeof body === "object" && "status" in body) {
      return body as GraviolaProblemDetails;
    }
    return null;
  } catch {
    return null;
  }
};

export const throwIfNotOk = async (res: Response): Promise<void> => {
  if (res.ok) return;
  const problem = await parseProblemDetailsBody(res);
  const code = problem?.code ?? `http_${res.status}`;
  const title = problem?.title ?? res.statusText ?? "Request failed";
  const detail = problem?.detail ?? `${res.url} → ${res.status}`;
  throw new GraviolaRestError(
    detail || title,
    res.status,
    code,
    problem ?? undefined,
  );
};
