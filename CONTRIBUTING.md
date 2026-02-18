# Contributing to yuque-mcp

Thanks for helping improve `yuque-mcp`.

## Scope

This project is a production-grade Yuque MCP server. Contributions are welcome for:
- bug fixes
- tests
- docs and examples
- safe feature improvements

## Local Setup

```bash
npm install
npm run check
npm test
npm run build
```

Run dev server:

```bash
npm run dev
```

## Branch and Commit Conventions

- Branch naming suggestion:
  - `feat/<short-name>`
  - `fix/<short-name>`
  - `docs/<short-name>`
- Commit message suggestion: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Pull Request Requirements

Please include:
- what changed
- why it changed
- how it was tested
- any breaking behavior (if applicable)

Before opening a PR, ensure:
- `npm run check` passes
- `npm test` passes
- `npm run build` passes
- related docs are updated

## Tool/API Contract Changes

If you change tool behavior, update these docs:
- `docs/03-tool-contract.md`
- `docs/04-api-mapping.md`
- `README.md`
- `README.zh-CN.md`

## Security and Secrets

- Never commit real tokens.
- Do not log secrets.
- Keep delete behavior safe-by-default (`YUQUE_ALLOW_DELETE=false` unless explicitly enabled).
- Preserve confirmation checks for destructive tools.

## Review and Response

- Maintainer target: first response within 2 business days.
- High-risk or security-sensitive changes may require extra review cycles.
