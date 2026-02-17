# yuque-mcp

This folder is prepared for building a custom MCP server for Yuque.

## Goal

Build a Yuque MCP server so Codex can:
- discover Yuque repos and docs
- read doc content in markdown/raw mode
- create/update/delete docs when needed
- create docs from local files and update docs from local files
- create/update/delete repos (knowledge bases)
- create/update/delete groups
- run combined operations (`get_my_repositories`, `get_repository_overview`, `search_and_read`, `create_document_with_toc`)
- update repository TOC nodes
- use Yuque content as a research knowledge base

## Included Docs

- `docs/00-project-brief.md`
- `docs/01-scope-v1.md`
- `docs/02-architecture.md`
- `docs/03-tool-contract.md`
- `docs/04-api-mapping.md`
- `docs/05-security.md`
- `docs/06-implementation-plan.md`
- `docs/07-test-plan.md`
- `docs/08-codex-integration.md`
- `docs/09-release-notes-zh.md`
- `CHANGELOG.md`
- `tasks/TODO.md`

## Session Kickoff

In your new Codex session, start with:
1. Read `docs/01-scope-v1.md` and `docs/03-tool-contract.md`.
2. Scaffold Node + TypeScript MCP server.
3. Implement read-only tools.
4. Add write tools for group/repo/doc CRUD + TOC update.
5. Run tests and add Codex MCP config.

## Quick Start (Local)

```bash
npm install
npm run build
```

Required env:

- `YUQUE_TOKEN`
- `YUQUE_ENDPOINT` (optional, default `https://www.yuque.com/api/v2/`)
- `YUQUE_TIMEOUT_MS` (optional, default `10000`)
- `YUQUE_MAX_RETRIES` (optional, default `2`, read-only retries only)
- `YUQUE_ALLOW_DELETE` (optional, default `false`)
- `YUQUE_DELETE_NAMESPACE_ALLOWLIST` (optional, comma-separated delete allowlist targets; namespace for repo/doc, login for group)

Delete safety:

- `yuque_delete_doc`, `yuque_delete_repo`, and `yuque_delete_group` are blocked by default.
- To enable delete for test repos only, set:
  - `YUQUE_ALLOW_DELETE=true`
  - `YUQUE_DELETE_NAMESPACE_ALLOWLIST=your/test-namespace,your-test-group-login`
- Delete tools also require `confirm: true` and exact `confirm_text`:
  - doc: `DELETE DOC <namespace>/<docRef>`
  - repo: `DELETE REPO <namespace>`
  - group: `DELETE GROUP <login>`

Latest highlights:

- `yuque_get_doc` / `yuque_update_doc` / `yuque_delete_doc` support either `slug` or `doc_id`.
- `yuque_list_docs` supports pagination (`offset`, `limit`).
- `yuque_search_docs` now scans paginated docs across the full repository.
- Doc format supports `markdown`, `html`, `lake`; visibility supports `0 | 1 | 2`.
- TOC update supports extra fields (`editNode`, `url`, `open_window`, `visible`).

Run in dev:

```bash
npm run dev
```

Run compiled server:

```bash
npm run start
```

Run local MCP smoke test (test namespace only):

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace npm run smoke
```

Run write smoke suite with cleanup (create/update/toc/delete on test namespace):

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace \
YUQUE_SMOKE_ENABLE_WRITE=true \
YUQUE_ALLOW_DELETE=true \
YUQUE_DELETE_NAMESPACE_ALLOWLIST=your/test-namespace \
npm run smoke
```

## Suggested Stack

- Node.js 20+
- TypeScript
- `@modelcontextprotocol/sdk`
- Native `fetch` or lightweight HTTP client
- `zod` for input validation
