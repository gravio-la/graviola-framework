export class SafeFetchError extends Error {
  readonly code:
    | "unsupported_scheme"
    | "private_target"
    | "dns_failed"
    | "redirect_limit"
    | "timeout"
    | "body_too_large"
    | "content_type_rejected"
    | "fetch_failed"
    | "bad_status";

  constructor(
    code: SafeFetchError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "SafeFetchError";
    this.code = code;
  }
}

export class AssetStoreError extends Error {
  readonly code:
    | "invalid_key"
    | "too_large"
    | "not_accepted"
    | "not_found"
    | "invalid_id";

  constructor(code: AssetStoreError["code"], message: string) {
    super(message);
    this.name = "AssetStoreError";
    this.code = code;
  }
}
