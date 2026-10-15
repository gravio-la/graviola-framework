import { isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

import { SafeFetchError } from "./errors.js";
import { sniffMime, stripMimeParameters } from "./mimeSniff.js";

const METADATA_HOST = "169.254.169.254";

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^198\.(1[89]|2[0-9])\./,
  /^192\.0\.0\./,
  /^(22[4-9]|23\d)\./,
  /^(24[0-9]|25[0-5])\./,
];

const SENSITIVE_QUERY =
  /^(token|key|sig|signature|auth|password|access_token)$/i;

export function stripIpv6Brackets(host: string): string {
  return host.replace(/^\[|\]$/g, "");
}

function parseIpv4MappedOrCompat(addr: string): string | undefined {
  const lower = addr.toLowerCase();
  if (lower.startsWith("::ffff:")) {
    const tail = lower.slice("::ffff:".length);
    if (isIP(tail) === 4) return tail;
    const parts = tail.split(":");
    if (parts.length === 2) {
      const hi = parseInt(parts[0]!, 16);
      const lo = parseInt(parts[1]!, 16);
      if (Number.isFinite(hi) && Number.isFinite(lo)) {
        return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      }
    }
  }
  if (lower.startsWith("::ffff:")) {
    return undefined;
  }
  if (lower.includes(".")) {
    const m = /^(::ffff:)?(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (m?.[2] && isIP(m[2]) === 4) return m[2];
  }
  return undefined;
}

function embeddedIpv4FromIpv6(addr: string): string | undefined {
  const lower = addr.toLowerCase();
  const mapped = parseIpv4MappedOrCompat(lower);
  if (mapped) return mapped;

  if (lower.startsWith("64:ff9b:")) {
    const tail = lower.slice("64:ff9b:".length);
    const parts = tail.split(":");
    if (parts.length >= 2) {
      const hi = parseInt(parts[0]!, 16);
      const lo = parseInt(parts[1]!, 16);
      if (Number.isFinite(hi) && Number.isFinite(lo)) {
        return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      }
    }
  }

  if (lower.startsWith("2002:")) {
    const tail = lower.slice("2002:".length).split(":")[0];
    if (tail && /^[0-9a-f]{1,4}$/i.test(tail)) {
      const n = parseInt(tail, 16);
      return `${(n >> 8) & 0xff}.${n & 0xff}.0.0`;
    }
  }

  return undefined;
}

export function isPrivateAddress(addr: string): boolean {
  const family = isIP(addr);
  if (family === 4) return PRIVATE_V4.some((re) => re.test(addr));
  if (family === 6) {
    const embedded = embeddedIpv4FromIpv6(addr);
    if (embedded) return isPrivateAddress(embedded);
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
    return false;
  }
  return false;
}

export function isPrivateHostname(host: string): boolean {
  const h = stripIpv6Brackets(host).toLowerCase();
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
  const hostname = stripIpv6Brackets(url.hostname);
  if (isPrivateHostname(hostname)) {
    throw new SafeFetchError(
      "private_target",
      `refusing private/loopback host: ${url.hostname}`,
    );
  }
  if (!isIP(hostname)) {
    let addresses: Array<{ address: string }> = [];
    try {
      addresses = await lookup(hostname);
    } catch (err) {
      throw new SafeFetchError(
        "dns_failed",
        `DNS lookup failed for ${hostname}: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
    if (addresses.some((a) => isPrivateAddress(a.address))) {
      throw new SafeFetchError(
        "private_target",
        `refusing host resolving to private address: ${hostname}`,
      );
    }
  } else if (isPrivateAddress(hostname)) {
    throw new SafeFetchError(
      "private_target",
      `refusing private IP: ${hostname}`,
    );
  }
}

function matchesAccept(encodingFormat: string, accept?: string[]): boolean {
  if (!accept?.length) return true;
  return accept.some((pattern) => {
    const p = pattern.toLowerCase();
    const ct = encodingFormat.toLowerCase();
    if (p.endsWith("/*")) return ct.startsWith(p.slice(0, -1));
    return ct === p;
  });
}

async function readBodyCapped(
  res: Response,
  maxBytes: number,
  deadlineAt: number,
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
    if (Date.now() > deadlineAt) {
      await reader.cancel().catch(() => undefined);
      throw new SafeFetchError("timeout", "timeout while reading body");
    }
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

export function sanitizeSourceUrl(inputUrl: string): string {
  const url = new URL(inputUrl);
  url.username = "";
  url.password = "";
  for (const key of [...url.searchParams.keys()]) {
    if (SENSITIVE_QUERY.test(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
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
  const deadlineAt = Date.now() + timeoutMs;
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
    if (Date.now() > deadlineAt) {
      throw new SafeFetchError("timeout", `timeout after ${timeoutMs}ms`);
    }
    await assertPublicTarget(current, lookup);

    const controller = new AbortController();
    const remaining = deadlineAt - Date.now();
    const timer = setTimeout(() => controller.abort(), Math.max(1, remaining));
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

    if (res.status < 200 || res.status >= 300) {
      throw new SafeFetchError(
        "bad_status",
        `HTTP ${res.status} from ${current.toString()}`,
      );
    }

    const bytes = await readBodyCapped(res, maxBytes, deadlineAt);
    const sniff = sniffMime(
      bytes,
      res.headers.get("content-type") ?? undefined,
    );
    if (!matchesAccept(sniff.encodingFormat, options.accept)) {
      throw new SafeFetchError(
        "content_type_rejected",
        `content not accepted after sniff: ${sniff.encodingFormat}`,
      );
    }

    const contentType =
      stripMimeParameters(
        res.headers.get("content-type") ?? sniff.encodingFormat,
      ) || null;

    return {
      bytes,
      contentType,
      finalUrl: sanitizeSourceUrl(current.toString()),
    };
  }
}
