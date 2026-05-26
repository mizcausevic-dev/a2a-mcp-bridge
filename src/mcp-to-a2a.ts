import type {
  A2AAgentCard,
  A2ASkill,
  McpDescriptor,
  McpToA2AOptions
} from "./types.js";

const DEFAULT_MODES = ["application/json"];

function skillFromTool(tool: { name: string; description?: string }): A2ASkill {
  return {
    id: tool.name,
    name: tool.name,
    description: (tool.description ?? "").trim() || `MCP tool ${tool.name}`,
    tags: ["mcp"],
    inputModes: DEFAULT_MODES,
    outputModes: DEFAULT_MODES
  };
}

/**
 * Translate an MCP server's metadata (server.json + tools/list) into an A2A
 * AgentCard. Each MCP tool becomes one A2A skill; the AgentCard is suitable
 * for serving at /.well-known/agent-card.json.
 */
export function mcpToA2A(mcp: McpDescriptor, opts: McpToA2AOptions = {}): A2AAgentCard {
  if (!mcp?.serverJson?.name) {
    throw new Error("MCP serverJson.name is required");
  }
  const skills = (mcp.toolsList?.tools ?? []).map(skillFromTool);
  const card: A2AAgentCard = {
    name: opts.name ?? mcp.serverJson.name,
    description:
      opts.description ??
      mcp.serverJson.description ??
      `MCP server ${mcp.serverJson.name}`,
    supportedInterfaces: opts.supportedInterfaces ?? [],
    capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
    defaultInputModes: opts.defaultInputModes ?? DEFAULT_MODES,
    defaultOutputModes: opts.defaultOutputModes ?? DEFAULT_MODES,
    skills
  };
  const version = opts.version ?? mcp.serverJson.version;
  if (version) card.version = version;
  if (opts.provider) card.provider = opts.provider;
  if (opts.documentationUrl) card.documentationUrl = opts.documentationUrl;
  else if (mcp.serverJson.repository?.url) card.documentationUrl = mcp.serverJson.repository.url;
  return card;
}
