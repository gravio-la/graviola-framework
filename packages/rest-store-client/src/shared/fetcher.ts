import ky, {
  HTTPError,
  type KyInstance,
  type Options,
  type RetryOptions,
} from "ky";

import type { GraviolaAuthMode } from "../handshake-types";
import { GraviolaRestError, throwIfNotOk } from "./errors";
import { newIdempotencyKey } from "./idempotency";

export type RestAuthConfig =
  | { mode: "none" }
  | { mode: "bearer"; token: () => string | Promise<string> }
  | { mode: "apiKey"; header: string; key: () => string | Promise<string> };

/** Default ky retry policy for REST transport (HTTP-aware retries, Retry-After, backoff cap). */
export const defaultRestTransportRetry: RetryOptions = {
  limit: 3,
  methods: ["get", "head", "put", "post", "patch", "delete"],
  statusCodes: [408, 413, 429, 500, 502, 503, 504],
  backoffLimit: 8000,
};

export type RestTransportOptions = {
  /** Absolute origin + optional prefix, e.g. https://api.example.com/graviola */
  baseUrl: string;
  auth: RestAuthConfig;
  fetchImpl?: typeof fetch;
  defaultHeaders?: Record<string, string>;
  /** Ky retry options (or shorthand number = retry limit). Defaults to {@link defaultRestTransportRetry}. */
  retry?: RetryOptions | number;
};

export type RestTransport = {
  readonly baseUrl: string;
  readonly auth: RestAuthConfig;
  advertisedAuthModes?: GraviolaAuthMode[];
  get(path: string, init?: RequestInit): Promise<Response>;
  getUnchecked(path: string, init?: RequestInit): Promise<Response>;
  head(path: string, init?: RequestInit): Promise<Response>;
  headUnchecked(path: string, init?: RequestInit): Promise<Response>;
  delete(path: string, init?: RequestInit): Promise<Response>;
  putJson(path: string, body: unknown, init?: RequestInit): Promise<Response>;
  postJson(path: string, body: unknown, init?: RequestInit): Promise<Response>;
  request(method: string, path: string, init?: RequestInit): Promise<Response>;
  mutatingJson(
    method: "PUT" | "POST" | "DELETE",
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<Response>;
};

const applyAuthHeaders = async (
  headers: Headers,
  auth: RestAuthConfig,
  advertisedModes: GraviolaAuthMode[] | undefined,
): Promise<void> => {
  if (auth.mode === "none") return;
  if (advertisedModes?.length && !advertisedModes.includes(auth.mode)) {
    throw new GraviolaRestError(
      `Auth mode ${auth.mode} not advertised by handshake`,
      400,
      "auth_mode_mismatch",
    );
  }
  if (auth.mode === "bearer") {
    const token = await auth.token();
    headers.set("Authorization", `Bearer ${token}`);
  } else if (auth.mode === "apiKey") {
    const key = await auth.key();
    headers.set(auth.header, key);
  }
};

const relInput = (path: string): string => {
  return path.replace(/^\/+/, "");
};

const toKyOptions = (init?: RequestInit): Omit<Options, "prefixUrl"> => {
  if (!init) return {};
  const { headers, ...rest } = init;
  return {
    ...rest,
    ...(headers !== undefined ? { headers: headers as HeadersInit } : {}),
  };
};

const mapKyHttpError = async (e: unknown): Promise<never> => {
  if (e instanceof HTTPError && e.response) {
    await throwIfNotOk(e.response);
  }
  throw e;
};

export const createRestTransport = (
  opts: RestTransportOptions,
): RestTransport => {
  const baseUrl = opts.baseUrl.replace(/\/+$/, "");
  const auth = opts.auth;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const defaultHeaders = opts.defaultHeaders ?? {};
  const retryOpt =
    opts.retry === undefined
      ? defaultRestTransportRetry
      : typeof opts.retry === "number"
        ? { ...defaultRestTransportRetry, limit: opts.retry }
        : opts.retry;

  const authState = {
    advertisedModes: undefined as GraviolaAuthMode[] | undefined,
  };

  const api: KyInstance = ky.create({
    prefixUrl: baseUrl,
    fetch: fetchImpl,
    retry: retryOpt,
    hooks: {
      beforeRequest: [
        async (request) => {
          for (const [k, v] of Object.entries(defaultHeaders)) {
            if (!request.headers.has(k)) request.headers.set(k, v);
          }
          await applyAuthHeaders(
            request.headers,
            auth,
            authState.advertisedModes,
          );
        },
      ],
    },
  });

  const transport: RestTransport = {
    baseUrl,
    auth,
    get advertisedAuthModes() {
      return authState.advertisedModes;
    },
    set advertisedAuthModes(v: GraviolaAuthMode[] | undefined) {
      authState.advertisedModes = v;
    },
    async get(path: string, init?: RequestInit): Promise<Response> {
      return transport.request("GET", path, init);
    },
    async getUnchecked(path: string, init?: RequestInit): Promise<Response> {
      const input = relInput(path);
      try {
        const res = await api(input, {
          method: "GET",
          ...toKyOptions(init),
          throwHttpErrors: (status) => status !== 404,
        });
        if (res.status === 404) return res;
        await throwIfNotOk(res);
        return res;
      } catch (e) {
        return mapKyHttpError(e);
      }
    },
    async head(path: string, init?: RequestInit): Promise<Response> {
      return transport.request("HEAD", path, init);
    },
    async headUnchecked(path: string, init?: RequestInit): Promise<Response> {
      const input = relInput(path);
      try {
        const res = await api(input, {
          method: "HEAD",
          ...toKyOptions(init),
          throwHttpErrors: (status) => status !== 404,
        });
        if (res.status === 404) return res;
        await throwIfNotOk(res);
        return res;
      } catch (e) {
        return mapKyHttpError(e);
      }
    },
    async delete(path: string, init?: RequestInit): Promise<Response> {
      return transport.request("DELETE", path, init);
    },
    async putJson(
      path: string,
      body: unknown,
      init?: RequestInit,
    ): Promise<Response> {
      return transport.request("PUT", path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers as Record<string, string>),
        },
        body: JSON.stringify(body),
      });
    },
    async postJson(
      path: string,
      body: unknown,
      init?: RequestInit,
    ): Promise<Response> {
      return transport.request("POST", path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers as Record<string, string>),
        },
        body: JSON.stringify(body),
      });
    },
    async request(
      method: string,
      path: string,
      init?: RequestInit,
    ): Promise<Response> {
      const input = relInput(path);
      try {
        const res = await api(input, {
          method,
          ...toKyOptions(init),
        });
        await throwIfNotOk(res);
        return res;
      } catch (e) {
        return mapKyHttpError(e);
      }
    },
    async mutatingJson(
      method: "PUT" | "POST" | "DELETE",
      path: string,
      body?: unknown,
      init?: RequestInit,
    ): Promise<Response> {
      const headers = new Headers(init?.headers);
      if (!headers.has("Idempotency-Key")) {
        headers.set("Idempotency-Key", newIdempotencyKey());
      }
      const req: RequestInit = {
        ...init,
        method,
        headers,
        body:
          method === "DELETE"
            ? undefined
            : JSON.stringify(body !== undefined ? body : {}),
      };
      if (method !== "DELETE") {
        headers.set("Content-Type", "application/json");
      }
      return transport.request(method, path, req);
    },
  };

  return transport;
};
