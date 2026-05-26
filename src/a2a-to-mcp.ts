import type {
  A2AAgentCard,
  A2ASkill,
  A2AToMcpOptions,
  A2AToMcpResult,
  McpServerJson,
  McpTool,
  McpToolsList
} from "./types.js";

function toolFromSkill(skill: A2ASkill): McpTool {
  return {
    name: skill.id || skill.name,
    description: skill.description,
    // A2A doesn't include JSON Schema for inputs — emit a permissive object schema.
    inputSchema: { type: "object", properties: {} }
  };
}

/**
 * Translate an A2A AgentCard into MCP metadata (a minimal server.json plus a
 * tools/list stub built from skills). Lossy by design: A2A's MIME-based I/O
 * modes, security schemes, and extensions don't have MCP equivalents and are
 * surfaced in `lossy` for human review.
 */
export function a2aToMcp(card: A2AAgentCard, opts: A2AToMcpOptions = {}): A2AToMcpResult {
  if (!card?.name) throw new Error("A2A AgentCard.name is required");
  if (!Array.isArray(card.skills)) throw new Error("A2A AgentCard.skills must be an array");

  const serverJson: McpServerJson = {
    name: opts.name ?? card.name,
    description: card.description ?? `A2A agent ${card.name}`
  };
  if (card.version) serverJson.version = card.version;
  if (card.documentationUrl) {
    serverJson.repository = { url: card.documentationUrl };
  }

  const toolsList: McpToolsList = { tools: card.skills.map(toolFromSkill) };

  // Track aspects of the AgentCard that don't survive the translation.
  const droppedSkillModes = new Set<string>();
  let skillsWithoutSchema = 0;
  for (const s of card.skills) {
    for (const m of s.inputModes ?? []) droppedSkillModes.add(m);
    for (const m of s.outputModes ?? []) droppedSkillModes.add(m);
    skillsWithoutSchema++; // A2A skills never carry a JSON Schema
  }

  return {
    serverJson,
    toolsList,
    lossy: {
      droppedSkillModes: [...droppedSkillModes].sort(),
      skillsWithoutSchema,
      securitySchemesDropped: card.securitySchemes ? Object.keys(card.securitySchemes).length : 0,
      extensionsDropped: (card.extensions?.length ?? 0) + (card.capabilities?.extensions?.length ?? 0)
    }
  };
}
