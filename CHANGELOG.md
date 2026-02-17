# Changelog

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
