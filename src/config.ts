import * as z from "zod/v4";
import { resolve } from "node:path";

const DEFAULT_ENDPOINT = "https://www.yuque.com/api/v2/";

const EnvSchema = z.object({
  YUQUE_TOKEN: z.string().trim().min(1, "YUQUE_TOKEN is required."),
  YUQUE_ENDPOINT: z.string().url().default(DEFAULT_ENDPOINT),
  YUQUE_TIMEOUT_MS: z.coerce.number().int().positive().max(60000).default(10000),
  YUQUE_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  YUQUE_ALLOW_WRITE: z.string().optional(),
  YUQUE_WRITE_NAMESPACE_ALLOWLIST: z.string().optional(),
  YUQUE_WRITE_GROUP_ALLOWLIST: z.string().optional(),
  YUQUE_ALLOW_DELETE: z.string().optional(),
  YUQUE_DELETE_NAMESPACE_ALLOWLIST: z.string().optional(),
  YUQUE_FILE_ROOT: z.string().trim().min(1).optional(),
  YUQUE_FILE_MAX_BYTES: z.coerce.number().int().positive().max(10 * 1024 * 1024).default(1024 * 1024),
  YUQUE_FILE_ALLOWED_EXTENSIONS: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export interface AppConfig {
  yuqueToken: string;
  yuqueEndpoint: string;
  timeoutMs: number;
  maxRetries: number;
  allowWrite: boolean;
  writeNamespaceAllowlist: string[];
  writeGroupAllowlist: string[];
  allowDelete: boolean;
  deleteNamespaceAllowlist: string[];
  fileRoot: string;
  fileMaxBytes: number;
  fileAllowedExtensions: string[];
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

function parseExtensionAllowlist(value?: string): string[] {
  const parsed = parseCsvList(value).map((item) => item.toLowerCase());
  return parsed.map((item) => (item.startsWith(".") ? item : `.${item}`));
}

function parseBooleanEnv(name: string, value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off", ""].includes(normalized)) {
    return false;
  }

  throw new Error(`${name} must be a boolean value (true/false/1/0/yes/no/on/off).`);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.parse(env);

  return {
    yuqueToken: parsed.YUQUE_TOKEN,
    yuqueEndpoint: ensureTrailingSlash(parsed.YUQUE_ENDPOINT),
    timeoutMs: parsed.YUQUE_TIMEOUT_MS,
    maxRetries: parsed.YUQUE_MAX_RETRIES,
    allowWrite: parseBooleanEnv("YUQUE_ALLOW_WRITE", parsed.YUQUE_ALLOW_WRITE, false),
    writeNamespaceAllowlist: parseCsvList(parsed.YUQUE_WRITE_NAMESPACE_ALLOWLIST),
    writeGroupAllowlist: parseCsvList(parsed.YUQUE_WRITE_GROUP_ALLOWLIST),
    allowDelete: parseBooleanEnv("YUQUE_ALLOW_DELETE", parsed.YUQUE_ALLOW_DELETE, false),
    deleteNamespaceAllowlist: parseCsvList(parsed.YUQUE_DELETE_NAMESPACE_ALLOWLIST),
    fileRoot: resolve(parsed.YUQUE_FILE_ROOT ?? process.cwd()),
    fileMaxBytes: parsed.YUQUE_FILE_MAX_BYTES,
    fileAllowedExtensions: parseExtensionAllowlist(
      parsed.YUQUE_FILE_ALLOWED_EXTENSIONS ?? ".md,.markdown,.txt",
    ),
    logLevel: parsed.LOG_LEVEL,
  };
}
