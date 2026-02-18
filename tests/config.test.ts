import { describe, expect, test } from "vitest";

import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  test("applies secure defaults", () => {
    const config = loadConfig({
      YUQUE_TOKEN: "token",
    });

    expect(config.allowWrite).toBe(false);
    expect(config.allowDelete).toBe(false);
    expect(config.fileAllowedExtensions).toEqual([".md", ".markdown", ".txt"]);
    expect(config.fileMaxBytes).toBe(1024 * 1024);
  });

  test("parses write allowlists and file constraints", () => {
    const config = loadConfig({
      YUQUE_TOKEN: "token",
      YUQUE_ALLOW_WRITE: "true",
      YUQUE_ALLOW_DELETE: "true",
      YUQUE_WRITE_NAMESPACE_ALLOWLIST: "team/repo-a, team/repo-b",
      YUQUE_WRITE_GROUP_ALLOWLIST: "team-alpha,team-beta",
      YUQUE_DELETE_NAMESPACE_ALLOWLIST: "team/repo-a",
      YUQUE_FILE_ROOT: "/tmp/yuque-files",
      YUQUE_FILE_MAX_BYTES: "4096",
      YUQUE_FILE_ALLOWED_EXTENSIONS: "md,.txt",
    });

    expect(config.allowWrite).toBe(true);
    expect(config.allowDelete).toBe(true);
    expect(config.writeNamespaceAllowlist).toEqual(["team/repo-a", "team/repo-b"]);
    expect(config.writeGroupAllowlist).toEqual(["team-alpha", "team-beta"]);
    expect(config.deleteNamespaceAllowlist).toEqual(["team/repo-a"]);
    expect(config.fileRoot).toBe("/tmp/yuque-files");
    expect(config.fileMaxBytes).toBe(4096);
    expect(config.fileAllowedExtensions).toEqual([".md", ".txt"]);
  });

  test("parses explicit false boolean env values correctly", () => {
    const config = loadConfig({
      YUQUE_TOKEN: "token",
      YUQUE_ALLOW_WRITE: "false",
      YUQUE_ALLOW_DELETE: "0",
    });

    expect(config.allowWrite).toBe(false);
    expect(config.allowDelete).toBe(false);
  });
});
