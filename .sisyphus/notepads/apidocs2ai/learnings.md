# Learnings — apidocs2ai

## Project Setup
- Runtime: Bun (not Node) — use `bun` everywhere, not `npm run` or `node`
- Package manager: bun (bun.lockb)
- Test: `bun test` (built-in, zero config)
- Build: `bun build` with `--target node` for npm, `--compile` for binary

## Critical API Notes (@scalar packages)
- `@scalar/openapi-parser`: DO NOT use `load()` — it's deprecated
- `validate(content)` → async, returns `{ valid, errors, schema, specification, version }`
- `dereference(content)` → SYNC (not async!), returns `{ specification, errors, schema, version, specificationType, specificationVersion }`
- `upgrade(spec, targetVersion)` from `@scalar/openapi-upgrader` → returns upgraded spec DIRECTLY (not wrapped), requires targetVersion arg e.g. `"3.1"`
- Circular refs: `dereference()` handles them gracefully — no timeout risk
- No need for `@scalar/json-magic` — use native `readFile` + `fetch` for loading
- Parse pipeline: load (readFile/fetch) → `validate()` → optional `upgrade()` for 2.0 → `dereference()`

## Bun Compile Gotchas
- `import.meta.url` BROKEN in Bun compile — use `process.argv[1]` or explicit paths
- `--compile` does NOT imply `--production` — add `--minify` explicitly
- UPX does NOT work with Bun compile output
- Binary sizes: macOS arm64 ~60MB, Linux x64 ~100MB, Windows ~116MB (document honestly)
- All 5 targets can build from single ubuntu-latest runner

## LAPIS Format
- Spec version: v0.1.0 (pin in output header: `# LAPIS v0.1.0`)
- Core sections only: [meta], [types], [ops], [webhooks], [errors]
- SKIP: [flows] and [limits] — no direct OpenAPI mapping
- Conversion order: resolve $ref → flatten allOf → deduplicate schemas → truncate descriptions 80 chars → centralize errors
- Operation syntax: `operationId METHOD /path`
- Param syntax: `> param_name: type` (required) / `> param_name?: type` (optional)
- Response syntax: `< ResponseType`
- Enum syntax: `"a" | "b" | "c"`
- Schema deduplication: referenced >1 time → named type in [types]; once → inline

## Agent CLI Patterns
- stdout = data ONLY, stderr = errors/warnings/progress
- Exit codes: 0=success, 1=general, 2=bad_args, 3=not_found, 4=parse_error, 5=network_error
- `--json` flag → JSON envelope: `{ok: true, data: ...}` on stdout
- TTY auto-detection: `!process.stdout.isTTY` → piped mode
- Stdin: 500ms timeout guard (Gemini CLI pattern)
- NO interactive prompts (agent-unfriendly)
- Respect `NO_COLOR` env var
