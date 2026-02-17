export interface ToolMeta {
  tool: string;
  timestamp: string;
}

export interface ToolErrorPayload {
  code: string;
  message: string;
  statusCode: number | null;
  details: Record<string, unknown> | null;
}

export interface ToolSuccess<TData> {
  ok: true;
  data: TData;
  meta: ToolMeta;
}

export interface ToolFailure {
  ok: false;
  error: ToolErrorPayload;
  meta: ToolMeta;
}

export type ToolEnvelope<TData> = ToolSuccess<TData> | ToolFailure;
