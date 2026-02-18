# Changelog

## 1.1.0 - 2026-02-18

- Added write safety gate for all write tools:
  - `YUQUE_ALLOW_WRITE` (default `false`)
  - `YUQUE_WRITE_NAMESPACE_ALLOWLIST`
  - `YUQUE_WRITE_GROUP_ALLOWLIST`
- Added file safety policy for file-based doc tools:
  - `YUQUE_FILE_ROOT`
  - `YUQUE_FILE_MAX_BYTES`
  - `YUQUE_FILE_ALLOWED_EXTENSIONS`
- Added group membership tools:
  - `yuque_list_group_users`
  - `yuque_add_group_user`
  - `yuque_remove_group_user`
- Fixed MCP server runtime version reporting by resolving version from `package.json` instead of hardcoded value.
- Added config unit tests and expanded service/client/schema test coverage for new policy and API mappings.
- Added npm publish file whitelist (`package.json#files`) to ship a cleaner package.

## 1.0.6 - 2026-02-18

- Switched project license to MIT (`package.json` + `LICENSE`).
- Added open-source governance docs (`CONTRIBUTING.md`, `SECURITY.md`, `DISCLAIMER.md`).
- Added complaint/takedown and weekly maintenance docs.
- Updated issue/PR templates and `CODEOWNERS`.

## 1.0.4 - 2026-02-18

- Changed npm package name to `@wwwwwujl/yuque-mcp` to match the npm organization scope.
- Updated `server.json` package identifier accordingly.
- Bumped server/package metadata version to `1.0.4`.

## 1.0.3 - 2026-02-18

- Added `server.json` for official MCP Registry publishing (schema `2025-12-11`).
- Added GitHub Actions workflow `.github/workflows/publish-mcp.yml` to publish npm package and MCP Registry metadata on version tags.
- Added Chinese README `README.zh-CN.md`.
- Added registry publishing guide `docs/10-registry-publish.md`.
- Added `mcpName` and repository metadata in `package.json`.

## 1.0.2 - 2026-02-17

- Added `npm run smoke` automation (`src/smoke.ts`) to run local MCP stdio smoke tests with stable pass/fail output.
- Smoke supports read-only mode and optional write mode with cleanup (`create/update/toc/delete`) on a test namespace.
- Updated test docs and runbook with smoke commands.
- Marked "Run local smoke tests via Codex MCP" as completed in TODO.

## 1.0.1 - 2026-02-17

- Improved `yuque_search_docs` to scan paginated document lists across the repository instead of only the first page.
- Kept search output shape stable while returning accurate `total` for cross-page matches.
- Added unit test coverage for multi-page search behavior.
- Aligned MCP server version with package version (`1.0.1`).
