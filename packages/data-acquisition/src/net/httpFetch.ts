export type FetchImpl = typeof fetch;

export type HttpFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
  attempts?: number;
  fetchImpl?: FetchImpl;
};

export type HttpFetchResult = {
  ok: boolean;
  status: number;
  text: string;
  attempts: number;
  retryable: boolean;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

export const httpFetch = async (
  url: string,
  options: HttpFetchOptions = {},
): Promise<HttpFetchResult> => {
  const {
    method = "GET",
    headers = {},
    body,
    signal,
    attempts = 4,
    fetchImpl = fetch,
  } = options;

  let lastError: unknown;
  let lastStatus = 0;
  let lastText = "";

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchImpl(url, { method, headers, body, signal });
      lastStatus = res.status;
      lastText = await res.text();

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          text: lastText,
          attempts: i + 1,
          retryable: false,
        };
      }

      if (!isRetryableStatus(res.status)) {
        return {
          ok: false,
          status: res.status,
          text: lastText,
          attempts: i + 1,
          retryable: false,
        };
      }

      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter
        ? Number(retryAfter) * 1000 || 500 * 2 ** i
        : 500 * 2 ** i;
      if (i < attempts - 1) await sleep(waitMs);
    } catch (err) {
      lastError = err;
      if (signal?.aborted) {
        return {
          ok: false,
          status: 0,
          text: String(err),
          attempts: i + 1,
          retryable: false,
        };
      }
      if (i < attempts - 1) await sleep(500 * 2 ** i);
    }
  }

  return {
    ok: false,
    status: lastStatus,
    text: lastText || String(lastError ?? "fetch failed"),
    attempts,
    retryable: isRetryableStatus(lastStatus) || lastStatus === 0,
  };
};

export const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};
