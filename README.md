# a2a-mcp-bridge

Bidirectional protocol-metadata translator between **Google A2A** (Agent-to-Agent) and the **Model Context Protocol (MCP)**. Take an MCP server's `server.json` + `tools/list` and get back a spec-shaped A2A **AgentCard** (suitable for `/.well-known/agent-card.json`). Take an A2A AgentCard and get back minimal MCP descriptors plus a `tools/list` stub.

Pure transform — does not bridge live traffic. The two protocols have different runtimes; this gives them a common discovery surface.

Closes the lane #4 (agent-runtime adapters) gap alongside [`agent-tool-adapters`](https://github.com/mizcausevic-dev/agent-tool-adapters) (MCP → OpenAI/Anthropic/Gemini/Vercel tool schemas) and [`agent-card-runtime-adapters`](https://github.com/mizcausevic-dev/agent-card-runtime-adapters) (Kinetic Gain Agent Card → runtime configs). Composes naturally with [`mcp-tools-snapshot`](https://github.com/mizcausevic-dev/mcp-tools-snapshot): snapshot a live MCP server, then bridge the result into A2A so it's discoverable to A2A clients.

## Why

A2A and MCP are the two open protocols for "what an AI agent can do," shipped by Google and Anthropic respectively. They describe nearly the same thing in different shapes — A2A has *skills* under an `AgentCard`, MCP has *tools* under a `server.json` + `tools/list`. A team running an MCP server still wants A2A clients to discover its surface (and vice versa). This is the bidirectional descriptor translation, with explicit accounting of what doesn't survive the trip.

## Install

```bash
npm install -g a2a-mcp-bridge   # CLI
npm install a2a-mcp-bridge      # library
```

Requires Node ≥ 20.

## CLI

```bash
# MCP → A2A AgentCard
a2a-mcp-bridge --direction mcp-to-a2a \
  --server-json server.json --tools-list tools.json > .well-known/agent-card.json

# A2A AgentCard → MCP descriptors
a2a-mcp-bridge --direction a2a-to-mcp --card agent-card.json --out mcp-bundle.json
```

## Library

```ts
import { mcpToA2A, a2aToMcp } from "a2a-mcp-bridge";

const agentCard = mcpToA2A({ serverJson, toolsList });
//   ↓ serve at /.well-known/agent-card.json

const { serverJson, toolsList, lossy } = a2aToMcp(agentCard);
console.log("dropped:", lossy.droppedSkillModes, "security:", lossy.securitySchemesDropped);
```

## What translates cleanly

| A2A AgentCard | ↔ | MCP |
|---|---|---|
| `name` | ↔ | `serverJson.name` |
| `description` | ↔ | `serverJson.description` |
| `version` | ↔ | `serverJson.version` |
| `documentationUrl` | ↔ | `serverJson.repository.url` |
| `skills[].id` | ↔ | `tools[].name` |
| `skills[].description` | ↔ | `tools[].description` |
| `skills[].tags` | ← only | `["mcp"]` injected on mcp-to-a2a |

## What's lossy (and surfaced in `a2aToMcp` result.lossy)

- **A2A inputModes/outputModes** (MIME types like `application/json`) — MCP tools have no equivalent; the modes are reported in `droppedSkillModes` for human review.
- **A2A securitySchemes / extensions / signatures** — no MCP equivalent; counts surface in `lossy.securitySchemesDropped` and `lossy.extensionsDropped`.
- **JSON Schema on tool inputs** — A2A skills never carry an input schema. `a2aToMcp` emits permissive `{ type: "object", properties: {} }` for every tool stub and reports `lossy.skillsWithoutSchema`.

`supportedInterfaces` on the AgentCard is the right place to declare that the agent speaks MCP; the bridge defaults it to `[]` and lets you populate it per your A2A SDK version (the field shape varies).

## License

AGPL-3.0-or-later — see [LICENSE](LICENSE).
