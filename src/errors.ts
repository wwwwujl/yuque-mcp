import { ZodError } from "zod/v4";

export type YuqueMcpErrorCode =
  | "AUTH_ERROR"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface YuqueMcpErrorParams {
  code: YuqueMcpErrorCode;
  message: string;
  statusCode?: number | null;
  details?: Record<string, unknown> | null;
}

export class YuqueMcpError extends Error {
  public readonly code: YuqueMcpErrorCode;
  public readonly statusCode: number | null;
  public readonly details: Record<string, unknown> | null;

  public constructor(params: YuqueMcpErrorParams) {
    super(params.message);
    this.name = "YuqueMcpError";
    this.code = params.code;
    this.statusCode = params.statusCode ?? null;
    this.details = params.details ?? null;
  }
}

export function mapHttpStatusToErrorCode(statusCode: number): YuqueMcpErrorCode {
  if (statusCode === 401) {
    return "AUTH_ERROR";
  }

  if (statusCode === 403) {
    return "PERMISSION_DENIED";
  }

  if (statusCode === 404) {
    return "NOT_FOUND";
  }

  if (statusCode === 429) {
    return "RATE_LIMITED";
  }

  if (statusCode >= 500) {
    return "UPSTREAM_ERROR";
  }

  return "UNKNOWN_ERROR";
}

function defaultMessageForStatus(statusCode: number): string {
  if (statusCode === 401) {
    return "Authentication failed for Yuque API.";
  }

  if (statusCode === 403) {
    return "Permission denied by Yuque API.";
  }

  if (statusCode === 404) {
    return "Requested Yuque resource was not found.";
  }

  if (statusCode === 429) {
    return "Yuque API rate limit exceeded.";
  }

  if (statusCode >= 500) {
    return "Yuque API is temporarily unavailable.";
  }

  return "Unexpected error from Yuque API.";
}

export function createHttpError(
  statusCode: number,
  upstreamMessage?: string | null,
  details?: Record<string, unknown> | null,
): YuqueMcpError {
  return new YuqueMcpError({
    code: mapHttpStatusToErrorCode(statusCode),
    message: upstreamMessage?.trim() || defaultMessageForStatus(statusCode),
    statusCode,
    details: details ?? null,
  });
}

export function toYuqueMcpError(error: unknown): YuqueMcpError {
  if (error instanceof YuqueMcpError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new YuqueMcpError({
      code: "VALIDATION_ERROR",
      message: "Tool input validation failed.",
      details: {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
      },
    });
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new YuqueMcpError({
      code: "NETWORK_ERROR",
      message: "Yuque API request timed out.",
    });
  }

  if (error instanceof Error) {
    return new YuqueMcpError({
      code: "UNKNOWN_ERROR",
      message: error.message || "Unknown error.",
    });
  }

  return new YuqueMcpError({
    code: "UNKNOWN_ERROR",
    message: "Unknown error.",
  });
}
