# Security

## Token Handling

- Load token from env only (`YUQUE_TOKEN`).
- Never hardcode token in source files.
- Never print token in logs or errors.

## Least Privilege

- Use read-only token/account scope when possible.
- For write-enabled sessions, use a scoped token and limit to required repos.
- Keep delete disabled by default (`YUQUE_ALLOW_DELETE=false`).
- When delete is needed, limit to test targets via `YUQUE_DELETE_NAMESPACE_ALLOWLIST`.
- Require second confirmation phrase for all delete tools (`group`, `repo`, `doc`).

## Logging

- Log request id, tool name, status code, latency.
- Redact headers and secret env values.

## Rate Limits

- Add retry for transient errors (429, 5xx) with capped backoff.
- Keep idempotent read retries only.
- Do not auto-retry write requests (`POST`, `PUT`).
