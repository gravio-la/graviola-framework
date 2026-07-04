import type { HttpMiddleware } from "../commands.js";

export type LoggingMiddlewareOptions = {
  log?: (message: string) => void;
};

/** Simple request/response logger middleware (proof of the HTTP seam). */
export const loggingMiddleware = (
  opts: LoggingMiddlewareOptions = {},
): HttpMiddleware => {
  const log = opts.log ?? ((msg: string) => console.log(msg));
  return async (req, _ctx, next) => {
    const started = Date.now();
    log(`→ ${req.method} ${new URL(req.url).pathname}`);
    const res = await next(req);
    log(
      `← ${req.method} ${new URL(req.url).pathname} ${res.status} (${Date.now() - started}ms)`,
    );
    return res;
  };
};
