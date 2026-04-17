# apidocs2ai

[![npm version](https://img.shields.io/npm/v/apidocs2ai)](https://www.npmjs.com/package/apidocs2ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/guibes/apidocs2ai/workflows/CI/badge.svg)](https://github.com/guibes/apidocs2ai/actions)

Convert OpenAPI/Swagger specs to AI-friendly formats with 85%+ token reduction.

## What and Why

LLMs waste context window on verbose JSON/YAML when consuming API specs. apidocs2ai converts OpenAPI documents into compact formats optimized for AI consumption.

The default output format is [LAPIS](docs/LAPIS-SPEC.md) (Lightweight API Specification), a human-readable notation that achieves dramatic token reduction: **84.8% on Petstore**, **82.7% on GitHub API**, **90.8% on DigitalOcean**, and **92.1% on Twilio**. Feed your AI agent an entire API surface in a fraction of the tokens.

## Quick Start

```bash
npm install -g apidocs2ai
apidocs2ai openapi.yaml
```

That's it. LAPIS output goes to stdout.

## Installation

### npm (global)

```bash
npm install -g apidocs2ai
```

### npx (no install)

```bash
npx apidocs2ai openapi.yaml
```

### Standalone binary

Download from [GitHub Releases](https://github.com/guibes/apidocs2ai/releases):

| Platform | Binary | Size |
|----------|--------|------|
| macOS (arm64) | `apidocs2ai-macos-arm64` | ~60 MB |
| macOS (x64) | `apidocs2ai-macos-x64` | ~60 MB |
| Linux (x64) | `apidocs2ai-linux-x64` | ~100 MB |
| Windows (x64) | `apidocs2ai-windows-x64.exe` | ~116 MB |

Binary sizes are large due to bundling the Bun runtime. This is a known Bun limitation.

```bash
chmod +x apidocs2ai-linux-x64
./apidocs2ai-linux-x64 openapi.yaml
```

## Usage

```
apidocs2ai [options] [input]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `input` | Path, URL, or pipe OpenAPI spec (JSON/YAML) |

### Options

| Option | Description |
|--------|-------------|
| `-f, --format <type>` | Output format: `lapis`, `json`, `markdown` (default: `lapis`) |
| `-o, --output <path>` | Write output to file instead of stdout |
| `-c, --copy` | Copy output to clipboard |
| `--strict` | Reject specs that fail validation (default: lenient) |
| `--json` | Wrap output in structured JSON envelope `{ok, data}` |
| `--pretty` | Pretty-print JSON output (json format only) |
| `-V, --version` | Output version number |
| `-h, --help` | Display help |

### Examples

```bash
# Local file (LAPIS output)
apidocs2ai openapi.yaml

# From URL
apidocs2ai https://petstore3.swagger.io/api/v3/openapi.json

# Markdown format
apidocs2ai openapi.yaml -f markdown

# JSON format, pretty-printed
apidocs2ai openapi.yaml -f json --pretty

# From stdin
cat openapi.yaml | apidocs2ai

# Write to file
apidocs2ai openapi.yaml -o api.lapis

# Copy to clipboard
apidocs2ai openapi.yaml --copy

# Structured JSON envelope for AI agents
apidocs2ai openapi.yaml --json
```

## Output Formats

### LAPIS (default)

LAPIS (Lightweight API Specification) is a compact notation designed for AI consumption. It replaces verbose OpenAPI JSON/YAML with a terse, human-readable format.

**Before** (OpenAPI JSON, 80+ lines for a single endpoint):
```json
{
  "paths": {
    "/pet/{petId}": {
      "get": {
        "tags": ["pet"],
        "summary": "Find pet by ID",
        "operationId": "getPetById",
        "parameters": [{
          "name": "petId",
          "in": "path",
          "required": true,
          "schema": { "type": "integer", "format": "int64" }
        }],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Pet" }
              }
            }
          }
        }
      }
    }
  }
}
```

**After** (LAPIS, 3 lines):
```
GET /pet/{petId}
  petId: int (path, required)
  -> 200: Pet
```

Full LAPIS example (Petstore):
```
# LAPIS v0.1.0

[meta]
api: Swagger Petstore - OpenAPI 3.0
base: /api/v3
version: 1.0.27
desc: Sample Pet Store Server based on the OpenAPI 3.0 specification
auth: oauth2 https://petstore3.swagger.io/oauth/authorize

[types]
Pet:
  id?: int
  name: str
  category?: Category
  photoUrls: [str]
  tags?: [Tag]
  status?: "available" | "pending" | "sold"
```

See [LAPIS Specification](docs/LAPIS-SPEC.md) for the full format reference.

### JSON

Outputs a structured JSON representation of the parsed API. Useful for programmatic consumption.

```bash
apidocs2ai openapi.yaml -f json --pretty
```

### Markdown

Outputs a Markdown document with endpoints, parameters, and schemas. Good for documentation and wikis.

```bash
apidocs2ai openapi.yaml -f markdown
```

## AI Integration

### Claude Code

Add the LAPIS output as project context:

```bash
apidocs2ai openapi.yaml -o api.lapis
# Add api.lapis to your Claude Code project knowledge
```

Or pipe directly:

```bash
apidocs2ai openapi.yaml --copy
# Paste into Claude conversation
```

### ChatGPT / Custom GPTs

```bash
apidocs2ai openapi.yaml -o api.lapis
# Upload api.lapis as a file attachment in ChatGPT
```

### AI Agents (programmatic)

Use the `--json` flag for structured output that agents can parse:

```bash
apidocs2ai openapi.yaml --json
# Returns: {"ok": true, "data": "..."}
```

Or use apidocs2ai as a library:

```typescript
import { convert } from "apidocs2ai";

const result = await convert("openapi.yaml", { format: "lapis" });
console.log(result);
```

## MCP Server (Claude Desktop / Claude Code)

apidocs2ai includes a built-in MCP (Model Context Protocol) server, allowing Claude to call it as a native tool.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apidocs2ai": {
      "command": "npx",
      "args": ["-y", "apidocs2ai-mcp"]
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

```bash
claude mcp add apidocs2ai -- npx -y apidocs2ai-mcp
```

### Other MCP Clients (Cursor, OpenCode, etc.)

Add to your MCP configuration:

```json
{
  "apidocs2ai": {
    "command": "npx",
    "args": ["-y", "apidocs2ai-mcp"]
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `convert-api-spec` | Convert an OpenAPI/Swagger spec to a compact AI-friendly format |

**Parameters:**
- `input` (string, required): URL or file path to the OpenAPI spec
- `format` (enum, optional): `lapis` (default), `json`, `markdown`

After setup, just ask Claude: "Convert this API spec: https://api.example.com/openapi.json"

## Supported Specs

| Specification | Versions |
|--------------|----------|
| OpenAPI | 3.1, 3.0 |
| Swagger | 2.0 (auto-upgraded to OpenAPI 3.0) |

Input formats: JSON and YAML.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Invalid input or processing error |
| `2` | File not found or network error |

## Contributing

### Dev Setup

```bash
git clone https://github.com/guibes/apidocs2ai.git
cd apidocs2ai
bun install
```

### Commands

```bash
bun test              # Run tests
bun run typecheck     # Type-check
bun run build         # Build for distribution
bun run start         # Run CLI directly
```

### Running locally

```bash
bun run src/cli.ts openapi.yaml
```

## License

[MIT](LICENSE)

## Acknowledgments

- [LAPIS Specification](docs/LAPIS-SPEC.md) - the compact API notation format
- [@scalar/openapi-parser](https://github.com/scalar/openapi-parser) - OpenAPI parsing and validation
- [@scalar/openapi-upgrader](https://github.com/scalar/openapi-upgrader) - Swagger 2.0 to OpenAPI 3.0 conversion
