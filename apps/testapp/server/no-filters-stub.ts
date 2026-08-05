/**
 * Negative-control stub: handshake advertises types without `filters`.
 * Walkthrough Phase 4 — capOrThrow → 501 capability_not_supported.
 *
 *   bun run server/no-filters-stub.ts
 */
const port = Number(process.env.PORT) || 3011;

const handshake = {
  graviolaStore: {
    version: "1",
    basePath: "/api/graviola",
    iriHandling: ["fullIRI"],
    auth: { modes: ["none"] },
    pagination: { modes: ["offset"] },
    idempotency: { supported: true, windowSeconds: 86400 },
    envelope: { supported: true },
    resolves: { supported: true },
    types: {
      Item: {
        capabilities: {
          loads: true,
          lists: true,
          // intentionally omit filters
          writes: true,
          removes: true,
          counts: true,
          searches: { mode: "substring", ranked: false },
        },
      },
    },
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (url.pathname === "/.well-known/graviola-store") {
      return Response.json(handshake, { headers: corsHeaders });
    }
    if (url.pathname === "/health") {
      return Response.json(
        { ok: true, filters: false },
        { headers: corsHeaders },
      );
    }
    if (url.pathname.startsWith("/api/graviola/")) {
      return Response.json(
        {
          error: "capability_not_supported",
          capability: "filters",
          message: "filters capability is not advertised for this type",
        },
        { status: 501, headers: corsHeaders },
      );
    }
    return new Response("not found", { status: 404, headers: corsHeaders });
  },
});

console.log(
  `no-filters stub at http://localhost:${port}` +
    `\n  handshake omits filters; /api/graviola/* returns 501`,
);
