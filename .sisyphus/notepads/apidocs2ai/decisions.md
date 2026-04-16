# Decisions — apidocs2ai

## Architecture
- Pipeline: load → parse → normalize(→3.1) → dereference → format → output
- Each stage independently testable
- Formatter interface: `{ name: string; format(spec: DereferencedSpec): string }`
- Wrap @scalar/openapi-parser behind adapter (API already churning)
- LAPIS formatter isolated behind Formatter interface (swappable)

## CLI Design
- Flat structure: `apidocs2ai <input> [options]` — NO subcommands
- Commander.js v12+ (zero deps, 50M DLs, ships TS types)
- Help groups for clean `--help` output
- Rich --help with Examples section (AI reads this to discover capabilities)

## Distribution
- npm + 5-platform Bun binaries
- npm entry: `dist/cli.js` with `#!/usr/bin/env node` shebang
- Binary build: `bun build --compile --minify` for all 5 targets
- GitHub Actions: test on push/PR, release workflow on `v*` tags

## Testing
- TDD: RED → GREEN → REFACTOR
- Framework: `bun test` (built-in)
- Golden files for LAPIS format verification
- E2E tests using `Bun.spawn` to run real CLI

## What's Out of Scope (v0)
- MCP server mode (v1)
- Plugin system
- GUI
- Custom DSL (using LAPIS v0.1.0 spec directly)
- [flows] and [limits] LAPIS sections
- OpenAPI spec generation (reverse direction)
