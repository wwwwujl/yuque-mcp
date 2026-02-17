# Scope V3

## In Scope

- Read-only access to Yuque account/group docs
- List repos and docs
- Read doc content with raw markdown option
- Basic keyword search implemented client-side
- Group CRUD: create/update/delete/get/list
- Repo CRUD: create/update/delete/get/list
- Create docs in an existing namespace
- Update docs in an existing namespace
- Delete docs in an existing namespace
- Update TOC nodes in an existing namespace
- Delete safety controls:
  - server-side delete switch (`YUQUE_ALLOW_DELETE`)
  - delete allowlist (`YUQUE_DELETE_NAMESPACE_ALLOWLIST`)
  - second confirmation text per delete target

## Out Of Scope

- Permission management
- Group member management
- Full text indexing database
- Multi-tenant auth brokerage

## Acceptance Criteria

- All read tools callable through MCP
- Group/repo/doc write tools and TOC update callable through MCP
- Proper error messages for 401/403/404/429/5xx
- Tool inputs validated with schema
- Delete operations require explicit second confirmation phrase
- Basic tests pass in CI/local
