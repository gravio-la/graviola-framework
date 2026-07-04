import type { SchemaRegistry } from "@graviola/store-core";

import type { CommandInterceptor } from "../commands.js";

export type ProvenanceStampOptions = {
  /** Property key under which provenance metadata is stamped onto upsert documents. */
  key?: string;
  source?: string;
};

/** Example interceptor stamping provenance onto upsert documents. */
export const provenanceStampInterceptor = <R extends SchemaRegistry>(
  opts: ProvenanceStampOptions = {},
): CommandInterceptor<R> => {
  const key = opts.key ?? "_provenance";
  const source = opts.source ?? "rest-store-server";
  return async (cmd, _ctx, next) => {
    if (cmd.kind !== "upsert") return next(cmd);
    const document =
      cmd.document && typeof cmd.document === "object"
        ? { ...(cmd.document as Record<string, unknown>) }
        : {};
    document[key] = {
      source,
      stampedAt: new Date().toISOString(),
    };
    return next({ ...cmd, document });
  };
};

/** Interceptor that short-circuits upsert without calling the store. */
export const shortCircuitUpsertInterceptor = <R extends SchemaRegistry>(
  response: unknown,
): CommandInterceptor<R> => {
  return async (cmd, _ctx, next) => {
    if (cmd.kind === "upsert") return response;
    return next(cmd);
  };
};
