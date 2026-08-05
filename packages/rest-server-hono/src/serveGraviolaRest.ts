import type { SchemaRegistry } from "@graviola/store-core";
import {
  createStoreFromEnv,
  createStoreFromSpec,
  type CreateStoreFromSpecOptions,
  type CreateStoreResult,
  type StoreBackendSpec,
} from "@graviola/store-factory";
import type { CreateStoreRestHandlerOptions } from "@graviola/rest-store-server";

import {
  createGraviolaHonoApp,
  type CreateGraviolaHonoAppOptions,
} from "./createGraviolaHonoApp.js";

export type ServeGraviolaRestOptions<
  R extends SchemaRegistry = SchemaRegistry,
> = Omit<CreateStoreFromSpecOptions<R>, "backend"> & {
  backend?: StoreBackendSpec;
  /** When true (default), resolve backend from env if `backend` omitted. */
  fromEnv?: boolean;
  port?: number;
  hostname?: string;
  basePath?: string;
  handshakePath?: string;
  cors?: CreateGraviolaHonoAppOptions<R>["cors"];
  enableLogger?: boolean;
  openapiDocument?: unknown;
  /** Extra handler options (auth, middleware, interceptors, routes). */
  handler?: Partial<
    Omit<CreateStoreRestHandlerOptions<R>, "store" | "typeNames">
  >;
};

export type ServeGraviolaRestResult = {
  url: string;
  port: number;
  store: CreateStoreResult["store"];
  typeNames: string[];
  stop: (closeActiveConnections?: boolean) => Promise<void>;
};

type BunServer = {
  port: number;
  hostname: string;
  stop: (closeActiveConnections?: boolean) => void;
};

type BunGlobal = {
  serve: (options: {
    port: number;
    hostname: string;
    fetch: (req: Request) => Response | Promise<Response>;
  }) => BunServer;
};

/**
 * One-call: create a Store from a backend spec (or env), wrap it in Hono,
 * and serve with Bun.serve (or `@hono/node-server` when Bun is unavailable).
 */
export async function serveGraviolaRest<
  R extends SchemaRegistry = SchemaRegistry,
>(opts: ServeGraviolaRestOptions<R>): Promise<ServeGraviolaRestResult> {
  const {
    port = Number(process.env.PORT) || 3010,
    hostname = "0.0.0.0",
    basePath = "/api/graviola",
    handshakePath,
    cors,
    enableLogger,
    openapiDocument,
    handler: handlerExtras = {},
    fromEnv = true,
    backend,
    ...storeOpts
  } = opts;

  const created =
    backend != null
      ? await createStoreFromSpec({ ...storeOpts, backend })
      : fromEnv
        ? await createStoreFromEnv(storeOpts)
        : await createStoreFromSpec({
            ...storeOpts,
            backend: { kind: "oxigraph" },
          });

  const app = createGraviolaHonoApp({
    store: created.store as CreateStoreRestHandlerOptions<R>["store"],
    typeNames: created.typeNames,
    basePath,
    handshakePath,
    cors,
    enableLogger,
    openapiDocument,
    ...handlerExtras,
  });

  const bunGlobal = (globalThis as typeof globalThis & { Bun?: BunGlobal }).Bun;

  if (bunGlobal?.serve) {
    const server = bunGlobal.serve({
      port,
      hostname,
      fetch: (req) => app.fetch(req),
    });
    const url = `http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${server.port}`;
    return {
      url,
      port: server.port,
      store: created.store,
      typeNames: created.typeNames,
      stop: async (closeActiveConnections?: boolean) => {
        server.stop(closeActiveConnections);
        await created.dispose?.();
      },
    };
  }

  // Node fallback via @hono/node-server (optional — resolved at runtime).
  try {
    const mod = (await import(
      /* @vite-ignore */ "@hono/node-server" as string
    )) as {
      serve: (opts: {
        fetch: typeof app.fetch;
        port: number;
        hostname: string;
      }) => {
        close: (cb?: (err?: Error) => void) => void;
        address: () => { port: number } | string | null;
      };
    };
    const nodeServer = mod.serve({
      fetch: app.fetch,
      port,
      hostname,
    });

    const actualPort =
      typeof nodeServer.address === "function"
        ? (() => {
            const addr = nodeServer.address();
            return typeof addr === "object" && addr ? addr.port : port;
          })()
        : port;

    const url = `http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${actualPort}`;
    return {
      url,
      port: actualPort,
      store: created.store,
      typeNames: created.typeNames,
      stop: async () => {
        await new Promise<void>((resolve, reject) => {
          nodeServer.close((err) => (err ? reject(err) : resolve()));
        });
        await created.dispose?.();
      },
    };
  } catch {
    throw new Error(
      "serveGraviolaRest requires Bun.serve or the optional `@hono/node-server` package",
    );
  }
}
