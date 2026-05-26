// Bidirectional protocol-metadata translator between Google A2A (Agent-to-Agent)
// and MCP (Model Context Protocol). Pure transforms; this does not bridge live
// traffic — it converts the descriptors so an A2A client can discover what an
// MCP server exposes (and vice versa).
//
// A2A field shapes are grounded on a2aproject/A2A docs/specification.md.
// MCP shapes follow the standard server.json + tools/list shapes.

// ─── A2A side ─────────────────────────────────────────────────────────────

/** Sub-shape: A2A AgentProvider. */
export interface A2AProvider {
  organization: string;
  url?: string;
}

/** Sub-shape: A2A AgentCapabilities. */
export interface A2ACapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  extendedAgentCard?: boolean;
  extensions?: unknown[];
}

/** Sub-shape: A2A AgentSkill. */
export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

/**
 * A2A AgentCard — typically served at `/.well-known/agent-card.json`.
 * `supportedInterfaces` shape varies by A2A SDK version; passed through as
 * a permissive `unknown[]` so consumers populate it per their toolchain.
 */
export interface A2AAgentCard {
  name: string;
  description: string;
  supportedInterfaces: unknown[];
  capabilities: A2ACapabilities;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: A2ASkill[];
  provider?: A2AProvider;
  iconUrl?: string;
  version?: string;
  documentationUrl?: string;
  securitySchemes?: Record<string, unknown>;
  security?: unknown[];
  extensions?: unknown[];
  signatures?: unknown[];
}

// ─── MCP side ─────────────────────────────────────────────────────────────

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpToolsList {
  tools: McpTool[];
}

/** Minimal `server.json` shape this bridge consumes/produces. */
export interface McpServerJson {
  $schema?: string;
  name: string;
  description?: string;
  version?: string;
  repository?: { url?: string; source?: string };
  packages?: unknown[];
  remotes?: unknown[];
  [key: string]: unknown;
}

/** Pair of MCP descriptors that together describe a server. */
export interface McpDescriptor {
  serverJson: McpServerJson;
  toolsList?: McpToolsList;
}

// ─── Bridge options + result shapes ───────────────────────────────────────

export interface McpToA2AOptions {
  /** Override `name` (default: `serverJson.name`). */
  name?: string;
  /** Override `description`. */
  description?: string;
  /** Override `version`. */
  version?: string;
  /** A2A provider block (organization + optional url). */
  provider?: A2AProvider;
  /** documentationUrl on the AgentCard. */
  documentationUrl?: string;
  /** Default MIME modes. Default: ["application/json"]. */
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  /** Populated as-is; consumers fill per their A2A SDK. Default: []. */
  supportedInterfaces?: unknown[];
}

export interface A2AToMcpOptions {
  /** Override the MCP server name (default: `card.name`). */
  name?: string;
}

export interface A2AToMcpResult {
  serverJson: McpServerJson;
  /** A2A skills become tool stubs; A2A carries no JSON Schema, so inputSchema is permissive. */
  toolsList: McpToolsList;
  /** Aspects that don't survive the transform; surfaced for human review. */
  lossy: {
    droppedSkillModes: string[];
    skillsWithoutSchema: number;
    securitySchemesDropped: number;
    extensionsDropped: number;
  };
}
