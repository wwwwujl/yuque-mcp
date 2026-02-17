import * as z from "zod/v4";

const DEFAULT_ENDPOINT = "https://www.yuque.com/api/v2/";

const EnvSchema = z.object({
  YUQUE_TOKEN: z.string().trim().min(1, "YUQUE_TOKEN is required."),
  YUQUE_ENDPOINT: z.string().url().default(DEFAULT_ENDPOINT),
  YUQUE_TIMEOUT_MS: z.coerce.number().int().positive().max(60000).default(10000),
  YUQUE_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  YUQUE_ALLOW_DELETE: z.coerce.boolean().default(false),
  YUQUE_DELETE_NAMESPACE_ALLOWLIST: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export interface AppConfig {
  yuqueToken: string;
  yuqueEndpoint: string;
  timeoutMs: number;
  maxRetries: number;
  allowDelete: boolean;
  deleteNamespaceAllowlist: string[];
  logLevel: "debug" | "info" | "warn" | "error";
}

function ensureTrailingSlash(value: string): string {
  if (value.endsWith("/")) {
    return value;
  }

  return `${value}/`;
}

function parseCsvList(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.parse(env);

  return {
    yuqueToken: parsed.YUQUE_TOKEN,
    yuqueEndpoint: ensureTrailingSlash(parsed.YUQUE_ENDPOINT),
    timeoutMs: parsed.YUQUE_TIMEOUT_MS,
    maxRetries: parsed.YUQUE_MAX_RETRIES,
    allowDelete: parsed.YUQUE_ALLOW_DELETE,
    deleteNamespaceAllowlist: parseCsvList(parsed.YUQUE_DELETE_NAMESPACE_ALLOWLIST),
    logLevel: parsed.LOG_LEVEL,
  };
}
