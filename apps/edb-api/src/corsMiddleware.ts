import type { HttpMiddleware } from "@graviola/rest-store-server";

const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:5182"];

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? DEFAULT_ORIGINS
).filter(Boolean);

const ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS";
// Idempotency-Key: sent by rest-store-client on every mutating request —
// omitting it here makes all browser writes fail in CORS preflight.
const ALLOWED_HEADERS =
  "Content-Type,Accept,Authorization,Idempotency-Key,X-API-Key";

export function resolveCorsOrigin(request: Request): string {
  const origin = request.headers.get("Origin");
  if (ALLOWED_ORIGINS.includes("*")) return "*";
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0] ?? "*";
}

export function corsHeaders(request: Request): HeadersInit {
  return {
    "Access-Control-Allow-Origin": resolveCorsOrigin(request),
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

/** Dev CORS for browser playground → import-api cross-origin calls. */
export const corsMiddleware = (): HttpMiddleware => {
  return async (req, _ctx, next) => {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(req),
      });
    }

    const res = await next(req);
    const headers = new Headers(res.headers);
    for (const [key, value] of Object.entries(corsHeaders(req))) {
      headers.set(key, value);
    }
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  };
};

export function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
