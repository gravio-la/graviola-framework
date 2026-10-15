import { isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

import { SafeFetchError } from "./errors.js";

const METADATA_HOST = "169.254.169.254";

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

export function isPrivateAddress(addr: string): boolean {
  const family = isIP(addr);
  if (family === 4) return PRIVATE_V4.some((re) => re.test(addr));
  if (family === 6) {
    const a = addr.toLowerCase();
    if (a === "::1" || a === "::") return true;
    if (a.startsWith("fc") || a.startsWith("fd")) return true;
    if (
      a.startsWith("fe8") ||
      a.startsWith("fe9") ||
      a.startsWith("fea") ||
      a.startsWith("feb")
    )
      return true;
    if (a.startsWith("::ffff:"))
      return isPrivateAddress(a.slice("::ffff:".length));
    return false;
  }
  return false;
}

export function isPrivateHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === METADATA_HOST) return true;
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  )
    return true;
  if (isIP(h)) return isPrivateAddress(h);
  return false;
}

export type DnsLookupFn = (
  hostname: string,
) => Promise<Array<{ address: string; family?: number }>>;

async function assertPublicTarget(
  url: URL,
  lookup: DnsLookupFn,
): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeFetchError(
      "unsupported_scheme",
      `unsupported scheme: ${url.protocol}`,
    );
  }
  if (isPrivateHostname(url.hostname)) {
    throw new SafeFetchError(
      "private_target",
      `refusing private/loopback host: ${url.hostname}`,
    );
  }
  if (!isIP(url.hostname)) {
    let addresses: Array<{ address: string }> = [];
    try {
      addresses = await lookup(url.hostname);
    } catch (err) {
      throw new SafeFetchError(
        "dns_failed",
        `DNS lookup failed for ${url.hostname}: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
    if (addresses.some((a) => isPrivateAddress(a.address))) {
      throw new SafeFetchError(
        "private_target",
        `refusing host resolving to private address: ${url.hostname}`,
      );
    }
  } else if (isPrivateAddress(url.hostname)) {
    throw new SafeFetchError(
      "private_target",
      `refusing private IP: ${url.hostname}`,
    );
  }
}

function contentTypeAllowed(
  contentType: string | null,
  accept?: string[],
): boolean {
  if (!accept?.length) return true;
  const ct = (contentType ?? "").toLowerCase().split(";")[0]?.trim() ?? "";
  return accept.some((pattern) => {
    const p = pattern.toLowerCase();
    if (p.endsWith("/*")) {
      const prefix = p.slice(0, -1);
      return ct.startsWith(prefix);
    }
    return ct === p;
  });
}

async function readBodyCapped(
  res: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const cl = res.headers.get("content-length");
  if (cl != null) {
    const n = Number(cl);
    if (Number.isFinite(n) && n > maxBytes) {
      throw new SafeFetchError(
        "body_too_large",
        `content-length ${n} exceeds maxBytes ${maxBytes}`,
      );
    }
  }
  if (!res.body) return new Uint8Array(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new SafeFetchError(
        "body_too_large",
        `response body exceeds maxBytes ${maxBytes}`,
      );
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(received);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.byteLength;
  }
  return merged;
}

export interface SafeFetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  accept?: string[];
  maxRedirects?: number;
  lookup?: DnsLookupFn;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
}

export interface SafeFetchResult {
  bytes: Uint8Array;
  contentType: string | null;
  finalUrl: string;
}

export async function safeFetch(
  inputUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxRedirects = options.maxRedirects ?? 3;
  const lookup: DnsLookupFn =
    options.lookup ??
    (async (hostname) => {
      const rows = await dnsLookup(hostname, { all: true });
      return rows.map((r) => ({ address: r.address, family: r.family }));
    });
  const doFetch = options.fetchImpl ?? fetch;

  let current = new URL(inputUrl);
  let redirects = 0;

  for (;;) {
    await assertPublicTarget(current, lookup);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await doFetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) {
        throw new SafeFetchError("timeout", `timeout after ${timeoutMs}ms`);
      }
      throw new SafeFetchError(
        "fetch_failed",
        err instanceof Error ? err.message : String(err),
        { cause: err },
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) {
        throw new SafeFetchError(
          "fetch_failed",
          `redirect ${res.status} without Location`,
        );
      }
      redirects += 1;
      if (redirects > maxRedirects) {
        throw new SafeFetchError(
          "redirect_limit",
          `too many redirects (>${maxRedirects})`,
        );
      }
      current = new URL(loc, current);
      continue;
    }

    const contentType = res.headers.get("content-type");
    if (!contentTypeAllowed(contentType, options.accept)) {
      throw new SafeFetchError(
        "content_type_rejected",
        `content-type not allowed: ${contentType ?? "(none)"}`,
      );
    }

    const bytes = await readBodyCapped(res, maxBytes);
    return {
      bytes,
      contentType,
      finalUrl: current.toString(),
    };
  }
}
