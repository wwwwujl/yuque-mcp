# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0.0 | No |

## Reporting a Vulnerability

Preferred channel:
- GitHub private security advisory: `https://github.com/wwwwujl/yuque-mcp/security/advisories/new`

If private advisory is unavailable:
- open an issue with title prefix `[SECURITY]` and avoid posting exploit details publicly.

## Response Targets

- Acknowledge report within 48 hours
- Initial triage within 7 days
- Fix/mitigation plan within 14 days when reproducible

## Project Security Baselines

- Yuque token must come from env var only.
- Never print secret values in logs.
- Input validation is required for all tools.
- Read-only retries must stay idempotent-only.
- Delete tools must remain guarded by:
  - explicit enable switch
  - allowlist
  - confirmation fields

## Disclosure Policy

Please allow time for coordinated disclosure before publishing full details.
