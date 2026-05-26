# Security Policy

`a2a-mcp-bridge` is an offline metadata transformer. It reads A2A AgentCard
JSON or MCP `server.json` / `tools/list` JSON that you provide and emits the
corresponding descriptor in the other protocol's shape. It performs no network
calls and invokes no agent runtime.

It reads only protocol-metadata fields (name, description, skills, tools). It
does not move credentials between the two protocols — A2A `securitySchemes`
are intentionally **dropped** during `a2aToMcp` and surfaced in the `lossy`
report so a reviewer must re-establish auth deliberately rather than have it
silently translated.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/a2a-mcp-bridge/security/advisories/new)

Do not file public issues for security reports.
