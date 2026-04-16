# apidocs2ai -- Project Context

CLI tool that converts OpenAPI/Swagger specs into AI-friendly formats. Parses OpenAPI 3.0.x, 3.1.x, and Swagger 2.0 (auto-upgraded), then outputs as LAPIS (80-92% token reduction), JSON, or Markdown. Single flat command, no subcommands. Input from file, URL, or stdin. Output to stdout, file, or clipboard.

## Architecture

```
stdin/file/URL
     |
  parser/         -- load + validate + dereference
     |             loader.ts: detect source, fetch/read
     |             adapter.ts: Swagger 2.0 -> OpenAPI 3.x
     |             index.ts: orchestrate parse pipeline
     |
  formatters/     -- transform OpenAPI AST to output format
     |  lapis/    -- compact token-efficient format (default)
     |  json/     -- machine-readable JSON
     |  markdown/ -- structured Markdown
     |
  output/         -- write result to destination
     |  writer.ts:       stdout helpers (output, error, warning, progress)
     |  destinations.ts: file write, clipboard write
     |  errors.ts:       structured stderr error formatting
     |  tty.ts:          TTY detection for progress messages
     |
  cli/            -- CLI entry point + wiring
     |  commands.ts: commander setup, option parsing
     |  pipeline.ts: orchestrate parse -> format -> output
     |  stdin.ts:    stdin detection and reading
     |  index.ts:    entry point
     |
  types/          -- shared types
       config.ts:  OutputFormat, InputSource, CliOptions
       errors.ts:  ExitCode enum, AppError class
```

## Key Files

| File | Purpose |
|------|---------|
| `src/cli.ts` | Entry point (imports cli/index.ts) |
| `src/cli/pipeline.ts` | Main orchestration: parse -> format -> write |
| `src/cli/commands.ts` | Commander program setup, option definitions |
| `src/parser/loader.ts` | Input detection (file/URL/stdin), fetching |
| `src/parser/adapter.ts` | Swagger 2.0 upgrade via @scalar/openapi-upgrader |
| `src/parser/index.ts` | Parse pipeline: load, upgrade, validate, dereference |
| `src/formatters/lapis/index.ts` | LAPIS formatter (default, token-compact) |
| `src/formatters/json/index.ts` | JSON formatter |
| `src/formatters/markdown/index.ts` | Markdown formatter |
| `src/output/writer.ts` | Stdout/stderr output helpers |
| `src/output/destinations.ts` | File and clipboard write |
| `src/types/errors.ts` | ExitCode enum (0-5), AppError class |
| `src/types/config.ts` | OutputFormat, InputSource, CliOptions |

## Development Commands

```bash
# Run CLI directly
bun run src/cli.ts openapi.yaml

# Run tests
bun test

# Run specific test file
bun test tests/unit/parser.test.ts

# Build for distribution
bun run build

# Type check
bun run typecheck
```

## Testing Patterns

- **Framework**: Bun test runner (`bun test`)
- **Structure**: `tests/unit/` for unit tests, `tests/e2e/` for CLI integration
- **Fixtures**: `tests/fixtures/` contains sample specs (minimal.yaml, petstore variants, invalid.yaml, circular-ref.yaml)
- **Golden files**: `tests/fixtures/petstore-3.0-expected.lapis` for LAPIS output comparison
- **E2E approach**: `Bun.spawn` to invoke the CLI as a subprocess, assert on stdout/stderr/exit code
- **TDD**: Write test first, then implement

## Key Constraints

- **No `import.meta.url`** in shared modules -- breaks when bundled
- **No deprecated `load()`** from @scalar/openapi-parser -- use current API
- **Flat CLI**: Single command, no subcommands. All behavior via flags
- **stdout/stderr discipline**: Formatted output goes to stdout only. Progress, warnings, errors go to stderr. This allows piping output cleanly
- **TTY-aware progress**: Progress messages only print when stderr is a TTY (suppressed in pipes)
- **Exit codes**: Always use ExitCode enum values (0-5). Never `process.exit()` with arbitrary numbers
- **AppError propagation**: Throw AppError with appropriate ExitCode; pipeline.ts catches and exits

## Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI argument parsing |
| `@scalar/openapi-parser` | OpenAPI 3.x parsing, validation, dereferencing |
| `@scalar/openapi-upgrader` | Swagger 2.0 to OpenAPI 3.x conversion |
| `@types/bun` | Bun runtime type definitions (dev) |

## Runtime

- **Runtime**: Bun (development), Node.js >= 18 (distribution)
- **Module system**: ESM (`"type": "module"`)
- **Build**: `bun build src/cli.ts --outdir dist --target node`
