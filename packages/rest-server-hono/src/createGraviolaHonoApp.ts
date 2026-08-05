import {
  createStoreRestHandler,
  type CreateStoreRestHandlerOptions,
} from "@graviola/rest-store-server";
import type { SchemaRegistry } from "@graviola/store-core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

export type CreateGraviolaHonoAppOptions<R extends SchemaRegistry> =
  CreateStoreRestHandlerOptions<R> & {
    /** Enable CORS (default true). Pass false to disable, or a CORS options object. */
    cors?: boolean | { origin?: string | string[]; credentials?: boolean };
    /** Mount Hono request logger (default true in non-test). */
    enableLogger?: boolean;
    /** Optional OpenAPI JSON document served at `openapiPath`. */
    openapiDocument?: unknown;
    openapiPath?: string;
    healthPath?: string;
  };

/**
 * Mount a Graviola Store REST handler on a Hono app.
 *
 * The WinterCG fetch handler from `@graviola/rest-store-server` is the core;
 * Hono only provides routing sugar, CORS, logging, `/health`, and optional OpenAPI.
 */
export function createGraviolaHonoApp<R extends SchemaRegistry>(
  opts: CreateGraviolaHonoAppOptions<R>,
): Hono {
  const {
    cors: corsOpt = true,
    enableLogger = process.env.NODE_ENV !== "test",
    openapiDocument,
    openapiPath = "/openapi.json",
    healthPath = "/health",
    ...handlerOpts
  } = opts;

  const handler = createStoreRestHandler(handlerOpts);
  const app = new Hono();

  if (enableLogger) {
    app.use("*", logger());
  }

  if (corsOpt !== false) {
    const corsOptions =
      typeof corsOpt === "object"
        ? {
            origin: corsOpt.origin ?? "*",
            credentials: corsOpt.credentials ?? true,
          }
        : { origin: "*", credentials: true };
    app.use("*", cors(corsOptions));
  }

  app.get(healthPath, (c) =>
    c.json({ ok: true, service: "graviola-rest-store" }),
  );

  if (openapiDocument != null) {
    app.get(openapiPath, (c) => c.json(openapiDocument));
  }

  // Catch-all: handshake + store routes. Handler returns null for unmatched paths.
  app.all("*", async (c) => {
    const res = await handler(c.req.raw);
    if (res == null) {
      return c.json(
        {
          type: "https://graviola.dev/errors/not_found",
          title: "Route not found",
          status: 404,
          code: "not_found",
        },
        404,
      );
    }
    return res;
  });

  return app;
}
