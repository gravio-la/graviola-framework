import type { CapabilityDescriptor, Identifies } from "@graviola/store-core";

export type GraviolaAuthMode = "none" | "bearer" | "apiKey";

export type GraviolaIriHandlingMode = "fullIRI" | "localId";

export type GraviolaTypeCapabilities = {
  loads?: boolean;
  lists?: boolean;
  filters?: boolean;
  writes?: boolean;
  removes?: boolean;
  counts?: boolean;
  searches?: {
    mode: "substring" | "token" | "fulltext";
    ranked?: boolean;
    caseSensitive?: boolean;
    perFieldWeights?: boolean;
  };
};

export type GraviolaStoreHandshakeInner = {
  version: string;
  basePath: string;
  iriHandling: GraviolaIriHandlingMode[];
  auth: {
    modes: GraviolaAuthMode[];
    apiKeyHeader?: string;
  };
  pagination: {
    modes: ("offset" | "cursor")[];
    maxLimit?: number;
  };
  idempotency?: {
    supported: boolean;
    windowSeconds?: number;
  };
  envelope?: {
    supported: boolean;
  };
  resolves?: {
    supported: boolean;
  };
  types: Record<string, { capabilities: GraviolaTypeCapabilities }>;
  openapiUrl?: string;
};

export type GraviolaStoreHandshakeResponse = {
  graviolaStore: GraviolaStoreHandshakeInner;
};

export type HandshakeOptions = {
  basePath: string;
  typeNames: string[];
  iriHandling: GraviolaIriHandlingMode[];
  auth?: {
    modes: GraviolaAuthMode[];
    apiKeyHeader?: string;
  };
  pagination?: {
    maxLimit?: number;
  };
  idempotency?: {
    supported: boolean;
    windowSeconds?: number;
  };
  resolvesSupported?: boolean;
  openapiUrl?: string;
};

const typeCapabilitiesFromDescriptor = (
  descriptor: CapabilityDescriptor,
): GraviolaTypeCapabilities => {
  const caps: GraviolaTypeCapabilities = {};
  if (descriptor.loads) caps.loads = true;
  if (descriptor.lists) caps.lists = true;
  if (descriptor.filters) caps.filters = true;
  if (descriptor.writes) caps.writes = true;
  if (descriptor.removes) caps.removes = true;
  if (descriptor.counts) caps.counts = true;
  if (descriptor.searches && descriptor.profiles?.searches) {
    caps.searches = {
      mode: descriptor.profiles.searches.mode,
      ranked: descriptor.profiles.searches.ranked,
      caseSensitive: descriptor.profiles.searches.caseSensitive,
      perFieldWeights: descriptor.profiles.searches.perFieldWeights,
    };
  } else if (descriptor.searches) {
    caps.searches = { mode: "substring", ranked: false };
  }
  return caps;
};

/** Compute handshake JSON from store descriptor + Identifies type names. */
export const computeHandshake = (
  descriptor: CapabilityDescriptor,
  _identifies: Identifies,
  opts: HandshakeOptions,
): GraviolaStoreHandshakeResponse => {
  const perTypeCaps = typeCapabilitiesFromDescriptor(descriptor);
  const types: GraviolaStoreHandshakeResponse["graviolaStore"]["types"] = {};
  for (const typeName of opts.typeNames) {
    types[typeName] = { capabilities: { ...perTypeCaps } };
  }

  const resolves = opts.resolvesSupported ?? Boolean(descriptor.resolves);

  return {
    graviolaStore: {
      version: "1",
      basePath: opts.basePath,
      iriHandling: opts.iriHandling,
      auth: opts.auth ?? { modes: ["none"] },
      pagination: {
        modes: ["offset"],
        ...(opts.pagination?.maxLimit != null
          ? { maxLimit: opts.pagination.maxLimit }
          : {}),
      },
      ...(opts.idempotency ? { idempotency: opts.idempotency } : {}),
      envelope: { supported: Boolean(descriptor.loads) },
      ...(resolves ? { resolves: { supported: true } } : {}),
      types,
      ...(opts.openapiUrl ? { openapiUrl: opts.openapiUrl } : {}),
    },
  };
};

export const DEFAULT_HANDSHAKE_PATH = "/.well-known/graviola-store";

export const normalizeBasePath = (basePath: string): string => {
  const trimmed = basePath.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

export const stripBasePath = (
  pathname: string,
  basePath: string,
): string | null => {
  const base = normalizeBasePath(basePath);
  if (pathname === base || pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length) || "/";
  }
  return null;
};

export const matchExtensionRoute = (
  method: string,
  relativePath: string,
  routes: import("./commands.js").ExtensionRoute[],
): {
  route: import("./commands.js").ExtensionRoute;
  params: Record<string, string>;
} | null => {
  const trimmed = relativePath.replace(/^\/+/, "").replace(/\/+$/, "");
  for (const route of routes) {
    if (route.method !== method) continue;
    const patternParts = route.path.replace(/^\/+/, "").split("/");
    const pathParts = trimmed.split("/").filter(Boolean);
    if (patternParts.length !== pathParts.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < patternParts.length; i++) {
      const pat = patternParts[i];
      const val = decodeURIComponent(pathParts[i]);
      if (pat.startsWith(":")) {
        params[pat.slice(1)] = val;
      } else if (pat !== pathParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
};
