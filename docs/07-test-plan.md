# Test Plan

## Unit Tests

- input schema validation
- endpoint path generation
- error mapping by status code
- client-side search filtering
- write payload validation for create/update
- write payload validation for delete/toc update
- delete second-confirmation phrase validation
- group/repo/doc CRUD API mapping
- ensure write requests are not retried

## Integration Tests

- mocked 200, 401, 403, 404, 429, 500 responses
- retries for transient failures only
- stable output contract per tool
- mocked create/update success and failure responses
- mocked delete/toc update success and failure responses
- delete allowlist policy and confirmation mismatch behaviors

## Manual Smoke Tests

1. Start local MCP server.
2. Register it in Codex.
3. Run each read tool once with valid input.
4. Run create/update/delete tools for group/repo/doc against test-only targets.
5. Run TOC update tool against a test repo.
6. Validate delete confirmation phrases and allowlist behavior.
7. Run failure cases (bad token, bad namespace).
8. Confirm no secret leakage in logs.

## Automated Smoke (Local MCP stdio)

Read suite only:

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace npm run smoke
```

Write suite + cleanup:

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace \
YUQUE_SMOKE_ENABLE_WRITE=true \
YUQUE_ALLOW_DELETE=true \
YUQUE_DELETE_NAMESPACE_ALLOWLIST=your/test-namespace \
npm run smoke
```
