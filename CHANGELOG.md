# Changelog

## v0.1.0 — 2026-05-26

- Initial release: bidirectional protocol-metadata translator between Google A2A and the Model Context Protocol.
- `mcpToA2A(serverJson, toolsList)` → spec-shaped A2A AgentCard ready for `/.well-known/agent-card.json`; required fields populated, capabilities set conservatively (streaming/pushNotifications/extendedAgentCard = false), MCP tools become A2A skills with the `mcp` tag.
- `a2aToMcp(card)` → minimal MCP `server.json` + `tools/list` stub. Lossy aspects (input/output MIME modes, securitySchemes, extensions, missing JSON Schemas) are surfaced in a `lossy` report instead of silently dropped.
- Pairs with `mcp-tools-snapshot` (live MCP capture → bridge → A2A AgentCard), `agent-tool-adapters`, and `agent-card-runtime-adapters` to complete lane #4.
- Library API (`mcpToA2A`, `a2aToMcp`) + CLI (`a2a-mcp-bridge`, `--direction mcp-to-a2a | a2a-to-mcp`).
- A2A field names grounded on `a2aproject/A2A` docs/specification.md.
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
