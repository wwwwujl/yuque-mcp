import { toYuqueMcpError } from "./errors.js";
import type { ToolEnvelope, ToolFailure, ToolSuccess } from "./types.js";

interface ToolResponseBlock {
  type: "text";
  text: string;
}

interface ToolCallResult {
  [key: string]: unknown;
  isError?: boolean;
  content: ToolResponseBlock[];
}

function createMeta(tool: string) {
  return {
    tool,
    timestamp: new Date().toISOString(),
  };
}

export function createSuccessEnvelope<TData>(tool: string, data: TData): ToolSuccess<TData> {
  return {
    ok: true,
    data,
    meta: createMeta(tool),
  };
}

export function createFailureEnvelope(tool: string, error: unknown): ToolFailure {
  const mapped = toYuqueMcpError(error);
  return {
    ok: false,
    error: {
      code: mapped.code,
      message: mapped.message,
      statusCode: mapped.statusCode,
      details: mapped.details,
    },
    meta: createMeta(tool),
  };
}

export function toToolResult<TData>(payload: ToolEnvelope<TData>, isError = false): ToolCallResult {
  return {
    ...(isError ? { isError: true } : {}),
    content: [
      {
        type: "text",
        text: JSON.stringify(payload),
      },
    ],
  };
}
