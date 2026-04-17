#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadAndParse } from "./parser/index.js";
import { LapisFormatter } from "./formatters/lapis/index.js";
import { JsonFormatter } from "./formatters/json/index.js";
import { MarkdownFormatter } from "./formatters/markdown/index.js";
import type { Formatter } from "./types/index.js";

const server = new McpServer(
  {
    name: "apidocs2ai",
    version: "0.2.0",
  },
  {
    instructions:
      "Converts OpenAPI/Swagger API specifications into compressed, AI-friendly formats. Use the convert-api-spec tool to reduce token usage when working with API documentation.",
  }
);

function getFormatter(format: string): Formatter {
  switch (format) {
    case "json":
      return new JsonFormatter({ pretty: true });
    case "markdown":
      return new MarkdownFormatter();
    case "lapis":
    default:
      return new LapisFormatter();
  }
}

server.tool(
  "convert-api-spec",
  "Convert an OpenAPI/Swagger spec to a compact AI-friendly format. Accepts a URL or file path. Returns the converted spec in the chosen format (lapis for max compression, markdown for readability, json for structured data).",
  {
    input: z
      .string()
      .describe(
        "URL or file path to the OpenAPI/Swagger spec (JSON or YAML)"
      ),
    format: z
      .enum(["lapis", "json", "markdown"])
      .default("lapis")
      .describe(
        "Output format: lapis (85% token reduction), json (filtered), markdown (readable)"
      ),
  },
  async ({ input, format }) => {
    try {
      const result = await loadAndParse(input, { strict: false });
      const formatter = getFormatter(format);
      const output = formatter.format(result.spec);

      const warnings =
        result.warnings.length > 0
          ? `\n\n---\nWarnings (${result.warnings.length}):\n${result.warnings.slice(0, 5).join("\n")}`
          : "";

      return {
        content: [{ type: "text" as const, text: output + warnings }],
      };
    } catch (err) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(err as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("apidocs2ai MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
