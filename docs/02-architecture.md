# Architecture

## Components

1. MCP Server Layer
- Declares tools and schemas
- Routes calls to service methods

2. Yuque Client Layer
- Wraps HTTP calls to Yuque API
- Handles headers, timeout, retry, and error mapping

3. Tool Service Layer
- Composes API calls into MCP-friendly responses
- Implements client-side search

4. Validation Layer
- Validates tool inputs
- Normalizes optional defaults

## Data Flow

1. Codex invokes MCP tool.
2. MCP handler validates input.
3. Service calls Yuque client.
4. Client calls Yuque API endpoint.
5. Response is normalized to stable JSON.
6. MCP returns structured output.

## Error Strategy

- Keep upstream status code in metadata
- Return user-safe message + debug detail field
- Never include secrets in error output

