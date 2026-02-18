# yuque-mcp

中文说明: [README.zh-CN.md](./README.zh-CN.md)

This folder is prepared for building a custom MCP server for Yuque.

## Goal

Build a Yuque MCP server so Codex can:
- discover Yuque repos and docs
- read doc content in markdown/raw mode
- create/update/delete docs when needed
- create docs from local files and update docs from local files
- create/update/delete repos (knowledge bases)
- create/update/delete groups
- manage group members (`list/add/remove`)
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
- `docs/10-registry-publish.md`
- `docs/11-weekly-maintenance.md`
- `docs/12-complaint-and-takedown.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `DISCLAIMER.md`
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
- `YUQUE_ALLOW_WRITE` (optional, default `false`)
- `YUQUE_WRITE_NAMESPACE_ALLOWLIST` (optional, comma-separated namespace allowlist for repo/doc/toc writes)
- `YUQUE_WRITE_GROUP_ALLOWLIST` (optional, comma-separated group login allowlist for group writes)
- `YUQUE_ALLOW_DELETE` (optional, default `false`)
- `YUQUE_DELETE_NAMESPACE_ALLOWLIST` (optional, comma-separated delete allowlist targets; namespace for repo/doc, login for group)
- `YUQUE_FILE_ROOT` (optional, default current working directory, used by file-based doc tools)
- `YUQUE_FILE_MAX_BYTES` (optional, default `1048576`)
- `YUQUE_FILE_ALLOWED_EXTENSIONS` (optional, default `.md,.markdown,.txt`)

Write safety:

- All write tools are blocked by default.
- Set `YUQUE_ALLOW_WRITE=true` to enable writes.
- Optional write allowlists:
  - `YUQUE_WRITE_NAMESPACE_ALLOWLIST=team/sandbox,team/test`
  - `YUQUE_WRITE_GROUP_ALLOWLIST=sandbox-team`

Delete safety:

- `yuque_delete_doc`, `yuque_delete_repo`, and `yuque_delete_group` are blocked by default.
- To enable delete for test repos only, set:
  - `YUQUE_ALLOW_WRITE=true`
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
- Group member tools: `yuque_list_group_users`, `yuque_add_group_user`, `yuque_remove_group_user`.
- File-based tools are constrained by root directory, extension allowlist, and max size.

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
YUQUE_ALLOW_WRITE=true \
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

## Open Source Governance

- Contribution guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`
- Weekly maintenance checklist: `docs/11-weekly-maintenance.md`
- Complaint and takedown policy: `docs/12-complaint-and-takedown.md`
- Disclaimer: `DISCLAIMER.md`
