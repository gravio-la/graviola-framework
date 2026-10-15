import { AssetHttpError, type AssetHttpErrorCode } from "./errors";

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message;
    }
  } catch {
    try {
      const text = await res.text();
      if (text.length > 0) return text;
    } catch {
      /* ignore */
    }
  }
  return res.statusText || `HTTP ${res.status}`;
}

function codeForStatus(status: number): AssetHttpErrorCode {
  if (status === 403) return "disabled";
  if (status === 413) return "too_large";
  if (status === 415) return "type_rejected";
  if (status === 422) return "fetch_rejected";
  return "http";
}

export async function assetErrorFromResponse(
  res: Response,
): Promise<AssetHttpError> {
  const message = await readErrorMessage(res);
  const code = codeForStatus(res.status);
  const human =
    code === "disabled"
      ? message || "Uploads are disabled for this project."
      : code === "too_large"
        ? message || "The file is too large."
        : code === "type_rejected"
          ? message || "This file type is not accepted."
          : code === "fetch_rejected"
            ? message || "Could not fetch the URL."
            : message;
  return new AssetHttpError(res.status, code, human);
}
