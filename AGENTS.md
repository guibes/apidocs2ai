# apidocs2ai -- AI Agent Reference

## What It Does

`apidocs2ai` converts OpenAPI/Swagger specifications into AI-friendly formats. The default LAPIS format achieves 80-92% token reduction compared to raw OpenAPI specs.

## Installation

```bash
# npm global
npm install -g apidocs2ai

# npx (no install)
npx apidocs2ai openapi.yaml

# From source
bun install && bun run src/cli.ts openapi.yaml
```

## MCP Server

apidocs2ai can run as an MCP server for native integration with Claude and other AI tools.

### Setup

```bash
# Claude Code
claude mcp add apidocs2ai -- npx -y apidocs2ai-mcp

# Claude Desktop / Other MCP clients
# Add to MCP config:
# { "command": "npx", "args": ["-y", "apidocs2ai-mcp"] }
```

### Tool: convert-api-spec

Converts an OpenAPI/Swagger spec to a compact format.

Parameters:
- `input` (string): URL or file path to OpenAPI spec
- `format` (string): "lapis" (default), "json", "markdown"

Returns: Converted spec as text content.

## Usage

```
apidocs2ai [options] [input]
```

Input accepts a file path, URL, or piped stdin (JSON or YAML).

## Options

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--version` | `-V` | Print version number | -- |
| `--format <type>` | `-f` | Output format: `lapis`, `json`, `markdown` | `lapis` |
| `--output <path>` | `-o` | Write output to file instead of stdout | -- |
| `--copy` | `-c` | Copy output to clipboard | `false` |
| `--strict` | -- | Reject specs that fail validation (default: lenient) | `false` |
| `--json` | -- | Wrap output in structured JSON envelope `{ok, format, data}` | `false` |
| `--pretty` | -- | Pretty-print JSON output (json format only) | `false` |
| `--help` | `-h` | Display help | -- |

## Output Formats

### lapis (default)

Custom compact format designed for LLM consumption. Strips descriptions, examples, and metadata. Retains endpoint signatures, parameters, request/response schemas. Achieves 80-92% token reduction.

### json

Machine-readable JSON representation of the parsed spec. Use with `--pretty` for human-readable indentation.

### markdown

Structured Markdown suitable for embedding in prompts or documentation.

## Structured JSON Output

When `--json` is passed, output is wrapped in an envelope:

```json
{
  "ok": true,
  "format": "lapis",
  "data": "<formatted output string>"
}
```

On error, the process exits with a non-zero code. Errors are written to stderr.

## Exit Codes

| Code | Name | Meaning |
|------|------|---------|
| 0 | SUCCESS | Conversion completed |
| 1 | GENERAL | Unspecified error |
| 2 | BAD_ARGS | Invalid arguments or unknown format |
| 3 | NOT_FOUND | Input file or URL not found |
| 4 | PARSE_ERROR | Spec parsing or validation failed |
| 5 | NETWORK_ERROR | URL fetch failed |

## Example Commands

```bash
# Convert local file to LAPIS (default)
apidocs2ai openapi.yaml

# Convert to Markdown
apidocs2ai openapi.yaml -f markdown

# Convert from URL
apidocs2ai https://petstore3.swagger.io/api/v3/openapi.json

# Pipe from stdin
cat openapi.yaml | apidocs2ai

# Write to file
apidocs2ai openapi.yaml -o out.lapis

# Copy to clipboard
apidocs2ai openapi.yaml --copy

# Structured JSON envelope for programmatic use
apidocs2ai openapi.yaml --json

# Pretty-printed JSON format
apidocs2ai openapi.yaml -f json --pretty

# Strict validation (reject invalid specs)
apidocs2ai openapi.yaml --strict
```

## Supported Spec Versions

- OpenAPI 3.0.x
- OpenAPI 3.1.x
- Swagger 2.0 (auto-upgraded to OpenAPI 3.x via @scalar/openapi-upgrader)

## Input Sources

| Source | Example |
|--------|---------|
| File path | `apidocs2ai ./spec.yaml` |
| URL | `apidocs2ai https://api.example.com/openapi.json` |
| Stdin | `cat spec.yaml \| apidocs2ai` |

Accepts both JSON and YAML formats.

## Output Destinations

| Destination | How |
|-------------|-----|
| Stdout | Default behavior |
| File | `--output <path>` or `-o <path>` |
| Clipboard | `--copy` or `-c` |

## Source

GitHub: [guibes/apidocs2ai](https://github.com/guibes/apidocs2ai)
License: MIT
