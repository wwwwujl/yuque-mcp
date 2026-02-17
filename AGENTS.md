# AGENTS

## Mission

Implement a production-grade Yuque MCP server in phases, starting from read-only and then adding safe write operations.

## Phase Rule

- Phase 1 must be read-only.
- No write operations in phase 1 (no create/update/delete).
- Phase 2 adds write operations for docs and TOC.

## Phase 1 Tool Set

- `yuque_get_current_user`
- `yuque_list_groups`
- `yuque_list_repos`
- `yuque_get_repo`
- `yuque_get_repo_toc`
- `yuque_list_docs`
- `yuque_get_doc`
- `yuque_search_docs` (client-side search over listed docs)

## Phase 2 Tool Set

- `yuque_create_doc`
- `yuque_update_doc`
- `yuque_delete_doc`
- `yuque_update_toc`

## Required Constraints

- Token comes only from env var.
- Never log token.
- Validate all tool inputs.
- Return stable JSON output shape.
- Add unit tests for validation and API mapping.

## Done Criteria For Phase 1

- All read-only tools implemented and tested.
- Clear error mapping for auth, permission, and not-found.
- Local run docs and Codex MCP integration docs updated.

## Done Criteria For Phase 2

- Doc create/update/delete and TOC update tools implemented and tested.
- Retries remain read-only and idempotent only.
- Local run docs and Codex integration docs include write tool usage notes.
