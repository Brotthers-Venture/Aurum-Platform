#!/usr/bin/env node
/** Exposes Google Stitch as an MCP server over stdio, for Claude Code or Claude Desktop on your computer. */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const file = join(homedir(), ".config", "stitch", "api-key");
const apiKey = process.env.STITCH_API_KEY?.trim() || (existsSync(file) ? readFileSync(file, "utf8").trim() : undefined);
if (!apiKey) {
  console.error("Set STITCH_API_KEY or save the key to ~/.config/stitch/api-key");
  process.exit(1);
}
await new StitchProxy({ apiKey, name: "stitch" }).start(new StdioServerTransport());
