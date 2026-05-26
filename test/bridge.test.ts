import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, it, expect } from "vitest";

import { mcpToA2A } from "../src/mcp-to-a2a.js";
import { a2aToMcp } from "../src/a2a-to-mcp.js";
import * as api from "../src/index.js";
import type {
  A2AAgentCard,
  McpDescriptor,
  McpServerJson,
  McpToolsList
} from "../src/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name: string): unknown =>
  JSON.parse(readFileSync(join(here, "..", "fixtures", name), "utf8"));

const sampleMcp = (): McpDescriptor => ({
  serverJson: fx("sample-server.json") as McpServerJson,
  toolsList: fx("sample-tools.json") as McpToolsList
});

describe("mcpToA2A", () => {
  const card = mcpToA2A(sampleMcp());

  it("propagates name/description/version + repository as documentationUrl", () => {
    expect(card.name).toBe("io.github.acme/billing");
    expect(card.description).toMatch(/MCP server/);
    expect(card.version).toBe("1.2.0");
    expect(card.documentationUrl).toBe("https://github.com/acme/mcp-billing");
  });

  it("emits required A2A fields and conservative capabilities", () => {
    expect(card.supportedInterfaces).toEqual([]);
    expect(card.capabilities).toEqual({
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false
    });
    expect(card.defaultInputModes).toContain("application/json");
    expect(card.defaultOutputModes).toContain("application/json");
  });

  it("maps each MCP tool to one A2A skill with stable id", () => {
    expect(card.skills).toHaveLength(3);
    const ids = card.skills.map((s) => s.id).sort();
    expect(ids).toEqual(["issue_refund", "list_invoices", "lookup_invoice"]);
    expect(card.skills[0]!.tags).toContain("mcp");
  });

  it("respects overrides + custom provider", () => {
    const custom = mcpToA2A(sampleMcp(), {
      name: "renamed",
      provider: { organization: "ACME", url: "https://acme.example" },
      defaultInputModes: ["text/plain"]
    });
    expect(custom.name).toBe("renamed");
    expect(custom.provider?.organization).toBe("ACME");
    expect(custom.defaultInputModes).toEqual(["text/plain"]);
  });

  it("synthesizes a description when an MCP tool lacks one", () => {
    const c = mcpToA2A({ serverJson: { name: "x" }, toolsList: { tools: [{ name: "ping" }] } });
    expect(c.skills[0]!.description).toBe("MCP tool ping");
  });

  it("emits an empty skills array when no tools/list provided", () => {
    const c = mcpToA2A({ serverJson: { name: "x", description: "y" } });
    expect(c.skills).toEqual([]);
  });

  it("rejects an MCP server without a name", () => {
    expect(() => mcpToA2A({ serverJson: { name: "" } })).toThrow(/name is required/);
  });
});

describe("a2aToMcp", () => {
  const card = fx("sample-agent-card.json") as A2AAgentCard;
  const result = a2aToMcp(card);

  it("produces minimal MCP server.json with version + repository", () => {
    expect(result.serverJson.name).toBe("acme-billing");
    expect(result.serverJson.version).toBe("1.2.0");
    expect(result.serverJson.repository?.url).toBe("https://github.com/acme/mcp-billing");
  });

  it("maps A2A skills to MCP tool stubs (permissive inputSchema)", () => {
    expect(result.toolsList.tools).toHaveLength(2);
    const refund = result.toolsList.tools.find((t) => t.name === "issue_refund")!;
    expect(refund.description).toMatch(/refund/);
    expect(refund.inputSchema).toEqual({ type: "object", properties: {} });
  });

  it("reports lossy aspects (modes, missing schemas, securitySchemes)", () => {
    expect(result.lossy.skillsWithoutSchema).toBe(2);
    expect(result.lossy.droppedSkillModes).toContain("application/json");
    expect(result.lossy.securitySchemesDropped).toBe(1);
  });

  it("rejects a card without name or skills", () => {
    expect(() => a2aToMcp({ skills: [] } as unknown as A2AAgentCard)).toThrow(/name is required/);
    expect(() => a2aToMcp({ name: "x" } as unknown as A2AAgentCard)).toThrow(/skills must be an array/);
  });
});

describe("roundtrip (mcp → a2a → mcp)", () => {
  it("preserves tool names and the server name through the bridge", () => {
    const card = mcpToA2A(sampleMcp());
    const back = a2aToMcp(card);
    expect(back.serverJson.name).toBe("io.github.acme/billing");
    expect(back.toolsList.tools.map((t) => t.name).sort()).toEqual([
      "issue_refund",
      "list_invoices",
      "lookup_invoice"
    ]);
  });
});

describe("public API", () => {
  it("re-exports the surface", () => {
    expect(typeof api.mcpToA2A).toBe("function");
    expect(typeof api.a2aToMcp).toBe("function");
  });
});
