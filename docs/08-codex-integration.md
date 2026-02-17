# Codex Integration

## Local MCP Registration Example

After server implementation, register it with Codex:

```bash
codex mcp add yuque-local -- node dist/server.js
```

Or with tsx in development:

```bash
codex mcp add yuque-local-dev -- npx tsx src/server.ts
```

## Verify

```bash
codex mcp list
codex mcp get yuque-local
```

## Local Build + Test

```bash
npm run check
npm test
npm run build
```

## Expected Runtime Env

- `YUQUE_TOKEN`
- `YUQUE_ENDPOINT` (optional)
- `YUQUE_TIMEOUT_MS` (optional, default `10000`)
- `YUQUE_MAX_RETRIES` (optional, default `2`)
- `YUQUE_ALLOW_DELETE` (optional, default `false`)
- `YUQUE_DELETE_NAMESPACE_ALLOWLIST` (optional, comma-separated delete targets)

Use shell export or an env loader before launching Codex.

## Tool Coverage

- Read tools: user/group/repo/doc query + client-side paginated search
- Combined read tools:
  - `yuque_get_my_repositories`
  - `yuque_get_repository_overview`
  - `yuque_search_and_read`
- Write tools:
  - groups: `yuque_create_group`, `yuque_update_group`, `yuque_delete_group`
  - repos: `yuque_create_repo`, `yuque_update_repo`, `yuque_delete_repo`
  - docs: `yuque_create_doc`, `yuque_create_document_with_toc`, `yuque_update_doc`, `yuque_delete_doc`
  - docs-from-file: `yuque_create_doc_from_file`, `yuque_update_doc_from_file`
  - toc: `yuque_update_toc`

## Delete Confirmation Notes

- All delete tools need:
  - `confirm: true`
  - exact `confirm_text`
- Confirmation text formats:
  - `DELETE GROUP <login>`
  - `DELETE REPO <namespace>`
  - `DELETE DOC <namespace>/<docRef>`

## Runtime Notes

- Some Yuque accounts/tokens return `404` for group write endpoints (`POST/PUT/DELETE /groups/...`) if tenant capabilities are not enabled.
