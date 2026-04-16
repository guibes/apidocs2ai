# Issues + Gotchas — apidocs2ai

## @scalar/openapi-parser API Churn
- `load()` is DEPRECATED — agents MUST NOT use it
- Correct pattern: `@scalar/json-magic/bundle` with plugins

## LAPIS Spec Risks
- LAPIS is v0.1.0 draft — potential breaking changes before v1.0
- No TypeScript implementation exists — porting from Python reference
- Python reference at: github.com/cr0hn/LAPIS/tree/main/tools/python/src/lapis_spec
- [flows]/[limits] sections have no OpenAPI mapping → SKIP

## Circular References
- @scalar/openapi-parser uses WeakSet-based detection (no infinite loop)
- But output may have object cycles → detect cycles post-dereference
- Break cycles with `$circular_ref: true` marker before LAPIS conversion

## Stdin Handling
- Some terminals never set `isTTY=false` → 500ms timeout guard required
- If no input arg AND `process.stdin.isTTY` → show help (not hang)

## Binary Sizes
- macOS arm64 ~60MB, Linux x64 ~100MB, Windows ~116MB (Bun limitation, no fix)
- Document honestly in README — do NOT claim "lightweight"

## Validation
- Real-world specs often fail strict validation but are parseable
- Default: lenient (warn on stderr, proceed)
- `--strict` flag: reject invalid specs with exit code 4
