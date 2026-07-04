import {
  createStoreRestHandler,
  type CreateStoreRestHandlerOptions,
} from "../createStoreRestHandler.js";

// Narrow structural type instead of bun-types: keeps this package free of a
// Bun devDependency while still type-checking the adapter in dts builds.
type BunServer = {
  port: number;
  hostname: string;
  stop(closeActiveConnections?: boolean): void;
};
type BunGlobal = {
  serve(options: {
    port: number;
    hostname: string;
    fetch: (req: Request) => Promise<Response>;
  }): BunServer;
};
declare const Bun: BunGlobal;

export type ServeStoreOptions<
  R extends import("@graviola/store-core").SchemaRegistry,
> = CreateStoreRestHandlerOptions<R> & {
  port?: number;
  hostname?: string;
};

/** Bun.serve sugar wrapping {@link createStoreRestHandler}. */
export const serveStore = <
  R extends import("@graviola/store-core").SchemaRegistry,
>(
  opts: ServeStoreOptions<R>,
): BunServer => {
  const { port = 3000, hostname = "0.0.0.0", ...handlerOpts } = opts;
  const handler = createStoreRestHandler(handlerOpts);
  return Bun.serve({
    port,
    hostname,
    fetch: async (req) => {
      const res = await handler(req);
      return res ?? new Response("Not Found", { status: 404 });
    },
  });
};
