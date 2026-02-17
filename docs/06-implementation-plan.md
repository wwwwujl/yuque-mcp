# Implementation Plan

## Milestone 1: Scaffold

- Initialize Node + TypeScript project
- Setup MCP server bootstrap
- Add config loader and env validation

## Milestone 2: Yuque Client

- Implement typed HTTP client
- Add auth header and timeout
- Add error mapping utility

## Milestone 3: Read-Only Tools

- Implement all tools listed in tool contract
- Add response normalizer
- Add client-side search tool

## Milestone 4: Write Tools

- Implement `yuque_create_group`
- Implement `yuque_update_group`
- Implement `yuque_delete_group`
- Implement `yuque_create_repo`
- Implement `yuque_update_repo`
- Implement `yuque_delete_repo`
- Implement `yuque_create_doc`
- Implement `yuque_update_doc`
- Implement `yuque_delete_doc`
- Implement `yuque_update_toc`
- Add validation for write payloads
- Add second-confirmation phrase validation for delete operations

## Milestone 5: Quality

- Unit tests for validators and mappers
- Integration tests with mocked Yuque API
- Smoke test in Codex via local MCP registration

## Milestone 6: Packaging

- Add runbook and troubleshooting docs
- Add release tag and changelog
