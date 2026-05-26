#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { a2aToMcp } from "./a2a-to-mcp.js";
import { mcpToA2A } from "./mcp-to-a2a.js";
import type { A2AAgentCard, McpDescriptor, McpServerJson, McpToolsList } from "./types.js";

type Direction = "mcp-to-a2a" | "a2a-to-mcp";
const DIRECTIONS: Direction[] = ["mcp-to-a2a", "a2a-to-mcp"];

interface Args {
  direction?: Direction;
  serverJson?: string;
  toolsList?: string;
  card?: string;
  out?: string;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--direction") {
      const v = argv[++i] as Direction;
      if (!DIRECTIONS.includes(v)) {
        throw new Error(`--direction must be one of: ${DIRECTIONS.join(", ")}`);
      }
      args.direction = v;
    } else if (a === "--server-json") args.serverJson = argv[++i];
    else if (a === "--tools-list") args.toolsList = argv[++i];
    else if (a === "--card") args.card = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `a2a-mcp-bridge — bidirectional protocol-metadata translator between A2A and MCP

Usage:
  a2a-mcp-bridge --direction mcp-to-a2a --server-json server.json [--tools-list tools.json] [--out card.json]
  a2a-mcp-bridge --direction a2a-to-mcp --card agent-card.json [--out mcp-bundle.json]

Pure transform — does not bridge live traffic.

Options:
  --direction <dir>    mcp-to-a2a | a2a-to-mcp
  --server-json <f>    MCP server.json (mcp-to-a2a)
  --tools-list <f>     MCP tools/list JSON (mcp-to-a2a; optional)
  --card <f>           A2A AgentCard JSON (a2a-to-mcp)
  --out <f>            Write result JSON to a file (default: stdout)
  -h, --help           Show this help.

Exit codes: 0 ok, 2 usage/IO error.`;

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }
  if (!args.direction) {
    process.stderr.write("--direction is required (mcp-to-a2a | a2a-to-mcp)\n");
    return 2;
  }
  let payload: unknown;
  try {
    if (args.direction === "mcp-to-a2a") {
      if (!args.serverJson) throw new Error("--server-json is required for mcp-to-a2a");
      const serverJson = JSON.parse(readFileSync(args.serverJson, "utf8")) as McpServerJson;
      const mcp: McpDescriptor = { serverJson };
      if (args.toolsList) {
        mcp.toolsList = JSON.parse(readFileSync(args.toolsList, "utf8")) as McpToolsList;
      }
      payload = mcpToA2A(mcp);
    } else {
      if (!args.card) throw new Error("--card is required for a2a-to-mcp");
      const card = JSON.parse(readFileSync(args.card, "utf8")) as A2AAgentCard;
      payload = a2aToMcp(card);
    }
  } catch (e) {
    process.stderr.write(`error: ${(e as Error).message}\n`);
    return 2;
  }
  const json = JSON.stringify(payload, null, 2);
  if (args.out) {
    writeFileSync(args.out, `${json}\n`, "utf8");
    process.stdout.write(`wrote ${args.direction} output to ${args.out}\n`);
  } else {
    process.stdout.write(`${json}\n`);
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  process.exit(run(process.argv.slice(2)));
}
