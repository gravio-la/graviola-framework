export type AssetHttpErrorCode =
  | "disabled"
  | "too_large"
  | "type_rejected"
  | "fetch_rejected"
  | "http";

export class AssetHttpError extends Error {
  readonly status: number;
  readonly code: AssetHttpErrorCode;

  constructor(
    status: number,
    code: AssetHttpErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AssetHttpError";
    this.status = status;
    this.code = code;
  }
}
