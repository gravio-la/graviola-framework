import type {
  AssetCandidateProvider,
  AssetKind,
  AssetService,
  AssetThumbnailSize,
  UploadedAsset,
} from "@graviola/edb-core-types";

import { assetIdOfValue, isAssetRefValue } from "./assetRef";
import { assetErrorFromResponse } from "./parseAssetError";
import { AssetHttpError } from "./errors";

export type CreateHttpAssetServiceOptions = {
  baseUrl: string;
  iriPrefix: string;
  /** When set, only storage keys under this project count as asset refs. */
  projectId?: string;
  enabled: boolean;
  accept?: Partial<Record<AssetKind, string[]>>;
  maxBytes?: number;
  candidates?: AssetCandidateProvider;
  fetch?: typeof fetch;
  /** Default credentials for upload/import fetch (XHR uses `include` when set). */
  credentials?: RequestCredentials;
};

type UploadOpts = NonNullable<Parameters<AssetService["upload"]>[1]> & {
  credentials?: RequestCredentials;
};

function trimBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function refOptions(options: CreateHttpAssetServiceOptions) {
  return { iriPrefix: options.iriPrefix, projectId: options.projectId };
}

/** Device pixel ratio is read only in the browser; SSR always behaves as dpr=1. */
function roundedDpr(raw?: number): number | undefined {
  const value =
    typeof raw === "number" && raw > 0
      ? raw
      : typeof globalThis !== "undefined" &&
          typeof document !== "undefined" &&
          "devicePixelRatio" in globalThis &&
          typeof globalThis.devicePixelRatio === "number"
        ? globalThis.devicePixelRatio
        : 1;
  const rounded = Math.min(3, Math.max(1, Math.round(value)));
  return rounded === 1 ? undefined : rounded;
}

function buildThumbQuery(size: AssetThumbnailSize, dpr?: number): string {
  const params = new URLSearchParams();
  if (typeof size === "object") {
    if (size.w != null) params.set("w", String(size.w));
    if (size.h != null) params.set("h", String(size.h));
  } else {
    params.set("size", size);
  }
  const effectiveDpr = roundedDpr(dpr);
  if (effectiveDpr != null) params.set("dpr", String(effectiveDpr));
  return params.toString();
}

async function uploadViaFetch(
  url: string,
  file: File,
  caption: string | undefined,
  signal: AbortSignal | undefined,
  fetchImpl: typeof fetch,
  credentials?: RequestCredentials,
): Promise<UploadedAsset> {
  const form = new FormData();
  form.append("file", file);
  if (caption) form.append("caption", caption);
  const res = await fetchImpl(url, {
    method: "POST",
    body: form,
    signal,
    credentials,
  });
  if (!res.ok) throw await assetErrorFromResponse(res);
  return (await res.json()) as UploadedAsset;
}

function uploadViaXhr(
  url: string,
  file: File,
  caption: string | undefined,
  signal: AbortSignal | undefined,
  onProgress: (fraction: number) => void,
  withCredentials: boolean,
): Promise<UploadedAsset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.withCredentials = withCredentials;

    const abort = () => {
      xhr.abort();
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal) {
      if (signal.aborted) {
        abort();
        return;
      }
      signal.addEventListener("abort", abort, { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (signal) signal.removeEventListener("abort", abort);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as UploadedAsset);
        return;
      }
      void assetErrorFromResponse(
        new Response(JSON.stringify(xhr.response ?? {}), {
          status: xhr.status,
          statusText: xhr.statusText,
        }),
      ).then(reject);
    };

    xhr.onerror = () => {
      if (signal) signal.removeEventListener("abort", abort);
      reject(new AssetHttpError(0, "http", "Network error during upload"));
    };

    xhr.onabort = () => {
      if (signal) signal.removeEventListener("abort", abort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    xhr.ontimeout = () => {
      if (signal) signal.removeEventListener("abort", abort);
      reject(new AssetHttpError(0, "http", "Upload timed out"));
    };

    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    xhr.send(form);
  });
}

export function createHttpAssetService(
  options: CreateHttpAssetServiceOptions,
): AssetService {
  const base = trimBaseUrl(options.baseUrl);
  const iriPrefix = options.iriPrefix.replace(/\/?$/, "/");
  const fetchImpl = options.fetch ?? fetch;
  const refOpts = refOptions(options);

  return {
    enabled: options.enabled,
    accept: options.accept,
    maxBytes: options.maxBytes,
    candidates: options.candidates,

    isAssetRef(value: unknown): boolean {
      return isAssetRefValue(value, refOpts);
    },

    assetIdOf(value: unknown): string | undefined {
      return assetIdOfValue(value, refOpts);
    },

    thumbnailUrl(
      ref: unknown,
      size: AssetThumbnailSize,
      opts?: { dpr?: number },
    ): string | undefined {
      const id = assetIdOfValue(ref, refOpts);
      if (!id) return undefined;
      const query = buildThumbQuery(size, opts?.dpr);
      return `${base}/${id}/thumb?${query}`;
    },

    originalUrl(ref: unknown): string | undefined {
      const id = assetIdOfValue(ref, refOpts);
      if (!id) return undefined;
      return `${base}/${id}/original`;
    },

    async upload(file, uploadOpts?: UploadOpts) {
      const url = `${base}/`;
      const signal = uploadOpts?.signal;
      const credentials = uploadOpts?.credentials ?? options.credentials;
      const xhrWithCredentials = credentials === "include";
      if (uploadOpts?.onProgress) {
        return uploadViaXhr(
          url,
          file,
          uploadOpts.caption,
          signal,
          uploadOpts.onProgress,
          xhrWithCredentials,
        );
      }
      return uploadViaFetch(
        url,
        file,
        uploadOpts?.caption,
        signal,
        fetchImpl,
        credentials,
      );
    },

    async importFromUrl(url, importOpts) {
      const res = await fetchImpl(`${base}/from-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: importOpts?.signal,
        credentials: options.credentials,
      });
      if (!res.ok) throw await assetErrorFromResponse(res);
      return (await res.json()) as UploadedAsset;
    },

    iriFor(asset: UploadedAsset): string {
      if (asset.iri) return asset.iri;
      return `${iriPrefix}asset/${asset.assetId}`;
    },
  };
}
