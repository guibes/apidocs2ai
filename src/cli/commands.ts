import { Command } from "commander";
import { readFileSync } from "node:fs";
import { LapisFormatter } from "../formatters/lapis/index.js";
import { JsonFormatter } from "../formatters/json/index.js";
import { MarkdownFormatter } from "../formatters/markdown/index.js";
import type { Formatter } from "../types/index.js";
import { OutputFormat } from "../types/index.js";

// Read version from package.json — avoid import.meta.url
let version = "0.1.0";
try {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  version = pkg.version;
} catch { /* use default */ }

export function getFormatter(format: OutputFormat, options: { pretty?: boolean } = {}): Formatter {
  switch (format) {
    case OutputFormat.LAPIS: return new LapisFormatter();
    case OutputFormat.JSON: return new JsonFormatter({ pretty: options.pretty ?? false });
    case OutputFormat.MARKDOWN: return new MarkdownFormatter();
    default: return new LapisFormatter();
  }
}

export function detectInputSource(input: string | undefined): "url" | "file" | "stdin" {
  if (!input) return "stdin";
  if (input.startsWith("http://") || input.startsWith("https://")) return "url";
  return "file";
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("apidocs2ai")
    .description("Convert OpenAPI/Swagger specs to AI-friendly formats with 85%+ token reduction")
    .version(version)
    .argument("[input]", "Path, URL, or pipe OpenAPI spec (JSON/YAML)")
    .option("-f, --format <type>", "Output format: lapis, json, markdown", "lapis")
    .option("-o, --output <path>", "Write output to file instead of stdout")
    .option("-c, --copy", "Copy output to clipboard")
    .option("--strict", "Reject specs that fail validation (default: lenient)")
    .option("--json", "Wrap output in structured JSON envelope {ok, data}")
    .option("--pretty", "Pretty-print JSON output (json format only)")
    .addHelpText("after", `
Examples:
  $ apidocs2ai openapi.yaml                     LAPIS format to stdout
  $ apidocs2ai openapi.yaml -f markdown         Markdown format
  $ apidocs2ai https://api.example.com/spec     From URL
  $ cat openapi.yaml | apidocs2ai               From stdin
  $ apidocs2ai openapi.yaml -o out.lapis        Write to file
  $ apidocs2ai openapi.yaml --copy              Copy to clipboard
  $ apidocs2ai openapi.yaml --json              Structured JSON output for AI agents
    `);

  return program;
}
