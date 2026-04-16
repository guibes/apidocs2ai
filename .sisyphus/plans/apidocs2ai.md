# apidocs2ai — OpenAPI to AI-Friendly Format CLI Tool

## TL;DR

> **Quick Summary**: Build `apidocs2ai`, an opensource TypeScript+Bun CLI that reads OpenAPI/Swagger specs and compresses them into AI-friendly formats (primarily LAPIS — 85%+ token reduction). First TypeScript LAPIS implementation.
> 
> **Deliverables**:
> - CLI tool: `apidocs2ai <input> [options]` — parse, compress, output
> - 3 output formats: LAPIS (primary), filtered JSON, markdown
> - Input: local files, URLs, stdin
> - Output: stdout, --output file, --copy clipboard
> - AI discoverability: AGENTS.md, CLAUDE.md, rich --help
> - Distribution: npm package + Bun compiled binaries (5 platforms)
> - CI/CD: GitHub Actions (test + binary release)
> - Comprehensive README
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Scaffold → Parser Adapter → LAPIS Formatter → CLI Layer → CI/CD

---

## Context

### Original Request
Build a CLI tool that reads OpenAPI docs and transforms them to a more compressed format for AI consumption. Reduce token usage, easy CLI integration with any AI agent. Good docs so AI understands commands.

### Interview Summary
**Key Discussions**:
- **Runtime**: TypeScript + Bun (fast, native TS, built-in bundler)
- **OpenAPI versions**: Both Swagger 2.0 and OpenAPI 3.x (including 3.1)
- **Input sources**: Local files (JSON/YAML), URLs (HTTP), stdin (piped)
- **Output formats**: Multiple via `--format` — LAPIS (primary), filtered JSON, markdown
- **Output destinations**: stdout (default), `--output` file, `--copy` clipboard
- **AI discoverability**: Rich `--help`, AI instruction files (AGENTS.md, CLAUDE.md). MCP = v1, not v0
- **CLI structure**: Flat (`apidocs2ai <input> [options]`), not noun-verb subcommands
- **Validation**: Lenient by default + `--strict` flag
- **Package name**: `apidocs2ai`
- **LAPIS scope**: Core sections only ([meta], [types], [ops], [webhooks], [errors]). Skip [flows] and [limits]
- **LAPIS version**: Pin to v0.1.0 in output header
- **Binary distribution**: Ship all 5 platforms (accept ~100MB+ on Linux/Windows)
- **Test strategy**: TDD with `bun test`
- **Opensource**: GitHub, public repo

**Research Findings**:
- **LAPIS** (Feb 2026 paper): 85.5% avg token reduction via domain-specific DSL. 7 sections, function-signature syntax. Python reference impl at `cr0hn/LAPIS`
- **@scalar/openapi-parser**: Supports 3.1, 2-5x faster than swagger-parser. `load()` deprecated — use `@scalar/json-magic/bundle` with plugins. `upgrade()` handles 2.0→3.1 auto-conversion
- **Commander.js v12+**: Zero deps, 50M weekly DLs, TS types, help groups
- **Agent CLI patterns**: `--json` flag, stdout/stderr split, granular exit codes, TTY auto-detection, stdin timeout guard
- **Binary sizes**: macOS arm64 ~60MB, Linux x64 ~100MB, Windows ~116MB (Bun limitation)

### Metis Review
**Identified Gaps** (addressed):
- `@scalar/openapi-parser` `load()` is deprecated → use `@scalar/json-magic/bundle` with plugins
- LAPIS `[flows]`/`[limits]` have no OpenAPI mapping → skip in v0
- No TS LAPIS implementation exists → port from Python reference
- Circular $ref handling → detect cycles, break with marker
- Real-world specs fail validation → lenient default + `--strict`
- Stdin needs 500ms timeout guard → implement Gemini CLI pattern
- `import.meta.url` broken in Bun compile → avoid, use `process.argv[1]`
- Binary sizes larger than expected → document honestly in README

---

## Work Objectives

### Core Objective
Build a production-quality CLI tool that converts OpenAPI/Swagger specs into token-efficient AI-friendly formats, with LAPIS as the primary output format achieving 85%+ token reduction.

### Concrete Deliverables
- `apidocs2ai` CLI executable (npm + standalone binaries)
- LAPIS formatter (first TypeScript implementation)
- Filtered JSON formatter
- Markdown formatter
- AGENTS.md + CLAUDE.md for AI discoverability
- Comprehensive README.md
- GitHub Actions CI/CD pipeline
- Full test suite (TDD)

### Definition of Done
- [ ] `apidocs2ai petstore.yaml` outputs valid LAPIS format
- [ ] `apidocs2ai petstore.yaml --format json` outputs filtered JSON
- [ ] `apidocs2ai petstore.yaml --format markdown` outputs markdown
- [ ] `apidocs2ai https://petstore3.swagger.io/api/v3/openapi.json` works
- [ ] `cat petstore.yaml | apidocs2ai` works via stdin
- [ ] `apidocs2ai petstore.yaml --output out.txt` writes to file
- [ ] `apidocs2ai petstore.yaml --copy` copies to clipboard
- [ ] `apidocs2ai --help` shows rich, AI-parseable help
- [ ] Token reduction ≥70% for non-trivial specs
- [ ] `bun test` passes all tests
- [ ] `npx apidocs2ai` works from npm
- [ ] GitHub Actions builds binaries for 5 platforms on release

### Must Have
- LAPIS format output (core sections: meta, types, ops, webhooks, errors)
- Swagger 2.0 + OpenAPI 3.x input support
- All 3 input sources (file, URL, stdin)
- All 3 output destinations (stdout, file, clipboard)
- `--json` flag for structured JSON output (agent-friendly)
- stdout = data only, stderr = progress/errors/warnings
- Granular exit codes (0-5)
- TTY auto-detection
- LAPIS v0.1.0 version pin in output
- TDD test suite
- AGENTS.md + CLAUDE.md
- README with installation, usage, examples, format docs

### Must NOT Have (Guardrails)
- MCP server mode (v1 scope)
- Plugin system
- GUI
- Custom DSL design (use LAPIS spec directly)
- OpenAPI spec generation (reverse direction)
- API testing/mocking features
- `[flows]` or `[limits]` LAPIS sections (no OpenAPI mapping)
- Factory patterns, DI containers, event buses (over-abstraction)
- JSDoc on every function (only public API + non-obvious logic)
- More than 3 output formats
- `import.meta.url` usage (broken in Bun compile)
- `load()` from `@scalar/openapi-parser` (deprecated)
- Noun-verb subcommands (flat CLI only)
- Claims of "lightweight binaries" (Linux/Windows are ~100MB+)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield — setup in Task 1)
- **Automated tests**: TDD (test-driven development)
- **Framework**: `bun test` (built-in, zero config)
- **Each task**: RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **CLI commands**: Use Bash — run command, assert exit code + stdout/stderr content
- **Formatters**: Use Bash (bun test) — golden-file comparison against known spec→output pairs
- **Integration**: Use Bash — pipe commands, test stdin, verify file output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — start immediately):
├── Task 1: Project scaffold + tooling [quick]
├── Task 2: Type definitions + interfaces [quick]
├── Task 3: LAPIS spec reference + test fixtures [quick]
└── Task 4: Output utilities (stdout/stderr/file/clipboard) [quick]

Wave 2 (Core pipeline — after Wave 1):
├── Task 5: Parser adapter (@scalar/openapi-parser wrapper) [deep]
├── Task 6: LAPIS formatter — [meta] + [types] sections [deep]
├── Task 7: LAPIS formatter — [ops] + [webhooks] + [errors] sections [deep]
├── Task 8: Filtered JSON formatter [unspecified-high]
└── Task 9: Markdown formatter [unspecified-high]

Wave 3 (CLI + Docs — after Wave 2):
├── Task 10: CLI layer (Commander.js + stdin + TTY + exit codes) [deep]
├── Task 11: AGENTS.md + CLAUDE.md [writing]
├── Task 12: README.md [writing]
└── Task 13: Integration tests (end-to-end CLI) [unspecified-high]

Wave 4 (Distribution — after Wave 3):
├── Task 14: npm package setup (package.json bin, build scripts) [quick]
├── Task 15: GitHub Actions CI (test on push/PR) [quick]
├── Task 16: GitHub Actions Release (binary builds + npm publish) [quick]
└── Task 17: LICENSE + .gitignore + repo setup [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

**Critical Path**: Task 1 → Task 5 → Task 6/7 → Task 10 → Task 14 → Task 16 → F1-F4 → user okay
**Parallel Speedup**: ~65% faster than sequential
**Max Concurrent**: 5 (Wave 2)

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 2, 3, 4, 5, 6, 7, 8, 9 |
| 2 | 1 | 5, 6, 7, 8, 9, 10 |
| 3 | 1 | 6, 7, 13 |
| 4 | 1, 2 | 10 |
| 5 | 1, 2 | 6, 7, 8, 9, 10 |
| 6 | 2, 3, 5 | 10, 13 |
| 7 | 2, 3, 5 | 10, 13 |
| 8 | 2, 5 | 10, 13 |
| 9 | 2, 5 | 10, 13 |
| 10 | 2, 4, 6, 7, 8, 9 | 13, 14 |
| 11 | 10 | — |
| 12 | 10 | — |
| 13 | 3, 6, 7, 8, 9, 10 | 14 |
| 14 | 10, 13 | 16 |
| 15 | 1 | 16 |
| 16 | 14, 15 | — |
| 17 | — | — |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1→`quick`, T2→`quick`, T3→`quick`, T4→`quick`
- **Wave 2**: 5 tasks — T5→`deep`, T6→`deep`, T7→`deep`, T8→`unspecified-high`, T9→`unspecified-high`
- **Wave 3**: 4 tasks — T10→`deep`, T11→`writing`, T12→`writing`, T13→`unspecified-high`
- **Wave 4**: 4 tasks — T14→`quick`, T15→`quick`, T16→`quick`, T17→`quick`
- **FINAL**: 4 tasks — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [x] 1. Project Scaffold + Tooling Setup

  **What to do**:
  - Initialize project: `bun init` with name `apidocs2ai`
  - Create `package.json` with: name, version 0.1.0, description, license MIT, type module, bin entry
  - Create `tsconfig.json`: strict mode, ES2022 target, module NodeNext, paths aliases
  - Create `bunfig.toml` with test config
  - Install dependencies: `commander` (CLI), `@scalar/openapi-parser` (parser), `@scalar/json-magic` (loading)
  - Create directory structure:
    ```
    src/
      cli.ts              (entry point)
      cli/                (CLI layer)
      parser/             (OpenAPI parser adapter)
      formatters/         (output formatters)
        lapis/
        json/
        markdown/
      output/             (stdout/stderr/file/clipboard utilities)
      types/              (shared type definitions)
    tests/
      fixtures/           (test OpenAPI specs)
      unit/               (unit tests)
      e2e/                (integration tests)
    docs/                 (LAPIS spec reference)
    ```
  - Create a smoke test: `tests/unit/smoke.test.ts` that imports and verifies project structure
  - Verify: `bun test` passes

  **Must NOT do**:
  - No source code implementation yet (just scaffold)
  - No over-engineered configs (minimal tsconfig, no ESLint yet)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure scaffolding, no complex logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for scaffold, git init is trivial

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7, 8, 9
  - **Blocked By**: None (starts immediately)

  **References**:
  **External References**:
  - Commander.js docs: `https://github.com/tj/commander.js#installation` — installation and basic setup
  - @scalar/openapi-parser: `https://github.com/scalar/openapi-parser` — package name and imports
  - @scalar/json-magic: `https://github.com/nicholasgriffintn/json-magic` — loading plugins for file/URL
  - Bun test docs: `https://bun.sh/docs/cli/test` — test runner config and API

  **Acceptance Criteria**:
  - [ ] `bun install` succeeds with zero errors
  - [ ] `bun test` passes smoke test
  - [ ] All directories from structure above exist
  - [ ] `package.json` has correct name, version, bin entry
  - [ ] `tsconfig.json` compiles with `bun build --no-bundle src/cli.ts`

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Project builds and tests pass
    Tool: Bash
    Preconditions: Fresh project directory with scaffold complete
    Steps:
      1. Run `bun install` — expect exit code 0, no errors on stderr
      2. Run `bun test` — expect exit code 0, "smoke" test passes
      3. Run `bun build --no-bundle src/cli.ts --outdir /tmp/apidocs2ai-build` — expect exit code 0
      4. Verify `ls src/types src/parser src/formatters src/output src/cli tests/fixtures tests/unit tests/e2e` — all dirs exist
    Expected Result: All commands succeed with exit code 0
    Failure Indicators: Missing directories, compilation errors, failed test
    Evidence: .sisyphus/evidence/task-1-scaffold-build.txt
  ```

  **Commit**: YES
  - Message: `chore: scaffold project with Bun + TypeScript + test setup`
  - Files: `package.json, tsconfig.json, bunfig.toml, src/**, tests/**`
  - Pre-commit: `bun test`

- [x] 2. Type Definitions + Interfaces

  **What to do**:
  - Create `src/types/openapi.ts`: types for parsed OpenAPI spec (reexport from @scalar/openapi-parser types)
  - Create `src/types/formatter.ts`: `Formatter` interface with `format(spec: ParsedSpec): string` method
  - Create `src/types/config.ts`: CLI config types — `OutputFormat` enum (lapis, json, markdown), `InputSource` enum (file, url, stdin), `CliOptions` interface
  - Create `src/types/output.ts`: output destination types — `OutputDestination` enum (stdout, file, clipboard)
  - Create `src/types/errors.ts`: error types with exit codes — `AppError` class, `ExitCode` enum (0-5)
  - Create `src/types/index.ts`: barrel export
  - TDD: Write tests first in `tests/unit/types.test.ts` verifying exports exist and types are correct

  **Must NOT do**:
  - No implementation of interfaces (just type definitions)
  - No runtime validation (types only)
  - No over-abstraction (no generics unless needed)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure type definitions, straightforward TS work
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Tasks 5, 6, 7, 8, 9, 10
  - **Blocked By**: Task 1

  **References**:
  **External References**:
  - @scalar/openapi-parser types: Import `OpenAPIV3`, `OpenAPIV3_1` from `@scalar/openapi-parser`
  - LAPIS spec sections: [meta], [types], [ops], [webhooks], [errors] — shapes the formatter interface
  - Commander.js option parsing: Commander produces plain objects from parsed options

  **Acceptance Criteria**:
  - [ ] Test file: `tests/unit/types.test.ts` exists and passes
  - [ ] `Formatter` interface exported with `format()` and `name` property
  - [ ] `CliOptions` includes: format, output, copy, strict, json, input
  - [ ] `ExitCode` enum: SUCCESS=0, GENERAL=1, BAD_ARGS=2, NOT_FOUND=3, PARSE_ERROR=4, NETWORK_ERROR=5
  - [ ] All types importable from `src/types/index.ts`

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Types are importable and correct
    Tool: Bash
    Preconditions: Task 1 scaffold complete
    Steps:
      1. Run `bun test tests/unit/types.test.ts` — expect PASS
      2. Create temp file that imports `{ Formatter, CliOptions, ExitCode }` from `src/types/index.ts`
      3. Run `bun build --no-bundle` on temp file — expect no type errors
    Expected Result: All types export correctly, bun test passes
    Failure Indicators: Import errors, missing exports, type compilation failures
    Evidence: .sisyphus/evidence/task-2-types-test.txt

  Scenario: ExitCode enum has all required codes
    Tool: Bash
    Preconditions: Types defined
    Steps:
      1. Run `bun -e "import { ExitCode } from './src/types'; console.log(JSON.stringify(ExitCode))"`
      2. Assert output contains: SUCCESS, GENERAL, BAD_ARGS, NOT_FOUND, PARSE_ERROR, NETWORK_ERROR
    Expected Result: All 6 exit codes present with values 0-5
    Failure Indicators: Missing enum members, wrong numeric values
    Evidence: .sisyphus/evidence/task-2-exitcodes.txt
  ```

  **Commit**: YES
  - Message: `feat(types): add core type definitions and interfaces`
  - Files: `src/types/**`
  - Pre-commit: `bun test`

- [x] 3. LAPIS Spec Reference + Test Fixtures

  **What to do**:
  - Fetch LAPIS spec from `https://raw.githubusercontent.com/cr0hn/LAPIS/main/spec.en.md` and save as `docs/lapis-spec-v0.1.0.md`
  - Study the Python reference implementation at `github.com/cr0hn/LAPIS/tree/main/tools/python/src/lapis_spec` for conversion rules
  - Create test fixtures:
    - `tests/fixtures/petstore-3.0.yaml` — OpenAPI 3.0 Petstore spec (standard example, 19 endpoints)
    - `tests/fixtures/petstore-2.0.json` — Swagger 2.0 Petstore spec
    - `tests/fixtures/petstore-3.0-expected.lapis` — Expected LAPIS output for Petstore 3.0 (golden file)
    - `tests/fixtures/circular-ref.yaml` — Spec with circular $ref for edge case testing
    - `tests/fixtures/minimal.yaml` — Minimal valid OpenAPI spec (1 endpoint)
    - `tests/fixtures/invalid.yaml` — Invalid YAML / invalid OpenAPI for error testing
  - Generate the expected LAPIS output manually based on the LAPIS spec rules:
    - Resolve $refs → flatten allOf → deduplicate schemas → truncate descriptions 80 chars → centralize errors
    - Use signature syntax: `operationId METHOD /path`
    - Pin output header: `# LAPIS v0.1.0`

  **Must NOT do**:
  - No formatter code (just fixtures and reference docs)
  - No inventing LAPIS syntax beyond v0.1.0 spec
  - No modifying the LAPIS spec reference

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File creation and fetching, no complex logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Tasks 6, 7, 13
  - **Blocked By**: Task 1

  **References**:
  **External References**:
  - LAPIS spec: `https://raw.githubusercontent.com/cr0hn/LAPIS/main/spec.en.md` — full format specification
  - LAPIS Python impl: `https://github.com/cr0hn/LAPIS/tree/main/tools/python/src/lapis_spec` — conversion logic reference
  - Petstore 3.0: `https://petstore3.swagger.io/api/v3/openapi.json` — standard test API
  - Petstore 2.0: `https://petstore.swagger.io/v2/swagger.json` — Swagger 2.0 version
  - LAPIS paper Table 4: Petstore 3.0 should compress from 4,634 to ~800 tokens (82.7% reduction)

  **Acceptance Criteria**:
  - [ ] `docs/lapis-spec-v0.1.0.md` contains full LAPIS spec
  - [ ] All 6 fixture files exist and are valid (except `invalid.yaml` which is intentionally invalid)
  - [ ] `petstore-3.0-expected.lapis` follows LAPIS v0.1.0 syntax exactly
  - [ ] Golden file starts with `# LAPIS v0.1.0`
  - [ ] Circular ref fixture has at least one circular `$ref`

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Fixtures are valid OpenAPI specs
    Tool: Bash
    Preconditions: Fixture files created
    Steps:
      1. Run `bun -e "import { validate } from '@scalar/openapi-parser'; const r = await validate(await Bun.file('tests/fixtures/petstore-3.0.yaml').text()); console.log(r.valid)"` — expect "true"
      2. Run same for `petstore-2.0.json` — expect parseable (may not validate strict but loads)
      3. Run same for `minimal.yaml` — expect "true"
      4. Verify `invalid.yaml` fails validation
    Expected Result: Valid specs validate, invalid spec fails
    Failure Indicators: Valid specs failing validation, invalid spec passing
    Evidence: .sisyphus/evidence/task-3-fixtures-valid.txt

  Scenario: Golden LAPIS file follows spec syntax
    Tool: Bash
    Preconditions: Golden file created
    Steps:
      1. Read `tests/fixtures/petstore-3.0-expected.lapis`
      2. Assert first line is `# LAPIS v0.1.0`
      3. Assert contains `[meta]` section
      4. Assert contains `[ops]` section with operation signatures
      5. Assert does NOT contain `[flows]` or `[limits]` sections
    Expected Result: Golden file follows LAPIS v0.1.0 core sections
    Failure Indicators: Missing sections, wrong header, presence of excluded sections
    Evidence: .sisyphus/evidence/task-3-golden-lapis.txt
  ```

  **Commit**: YES
  - Message: `test(fixtures): add LAPIS spec reference and test fixtures`
  - Files: `docs/lapis-spec-v0.1.0.md, tests/fixtures/**`
  - Pre-commit: `bun test`

- [x] 4. Output Utilities (stdout/stderr/file/clipboard)

  **What to do**:
  - TDD: Write tests first in `tests/unit/output.test.ts`
  - Create `src/output/writer.ts`: Functions for writing output
    - `writeOutput(data: string)` → writes to stdout
    - `writeError(message: string)` → writes structured error to stderr
    - `writeWarning(message: string)` → writes warning to stderr
    - `writeProgress(message: string)` → writes progress to stderr (only if TTY)
  - Create `src/output/destinations.ts`: Output destination handlers
    - `writeToFile(data: string, path: string)` → writes to file
    - `writeToClipboard(data: string)` → copies to clipboard (detect OS: pbcopy/xclip/xsel/clip.exe)
    - `writeToStdout(data: string)` → writes to process.stdout
  - Create `src/output/errors.ts`: Structured error envelope
    - `formatError(type: string, message: string, hint?: string, retryable?: boolean)` → JSON error envelope on stderr
  - Create `src/output/tty.ts`: TTY detection utility
    - `isTTY()` → checks `process.stdout.isTTY`
    - `shouldUseColors()` → checks TTY + NO_COLOR env
  - Create `src/output/index.ts`: barrel export
  - All output functions MUST enforce: stdout = data only, stderr = everything else

  **Must NOT do**:
  - No spinner/progress bar libraries (simple stderr messages)
  - No color libraries (use ANSI codes if needed, respect NO_COLOR)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Utility functions, straightforward I/O wrappers
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2

  **References**:
  **External References**:
  - Agent CLI patterns: stdout = data only, stderr = progress/errors — `https://dev.to/tumf/agentic-cli-design-7-principles-for-designing-cli-as-a-protocol-for-ai-agents-2c10`
  - Clipboard detection: `pbcopy` (macOS), `xclip` (Linux X11), `xsel` (Linux), `clip.exe` (Windows/WSL)
  - NO_COLOR standard: `https://no-color.org/` — respect `NO_COLOR` env var
  - Structured error envelope: `{error: true, error_type: string, message: string, hint?: string, retryable: boolean}`

  **Acceptance Criteria**:
  - [ ] Test file: `tests/unit/output.test.ts` passes
  - [ ] `writeOutput()` writes ONLY to stdout
  - [ ] `writeError()` writes ONLY to stderr with JSON envelope
  - [ ] `writeToFile()` creates file with correct content
  - [ ] `writeToClipboard()` detects platform clipboard command
  - [ ] `isTTY()` correctly detects terminal vs piped
  - [ ] All functions importable from `src/output/index.ts`

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: stdout/stderr separation is enforced
    Tool: Bash
    Preconditions: Output utilities implemented
    Steps:
      1. Create test script that calls writeOutput("DATA") and writeError("general", "oops")
      2. Run: `bun run test-script.ts 2>/dev/null` — expect ONLY "DATA" on stdout
      3. Run: `bun run test-script.ts 2>&1 1>/dev/null` — expect ONLY error JSON on stderr
    Expected Result: Data on stdout, errors on stderr, never mixed
    Failure Indicators: Data appearing on stderr, errors appearing on stdout
    Evidence: .sisyphus/evidence/task-4-stdout-stderr.txt

  Scenario: File output writes correctly
    Tool: Bash
    Preconditions: Output utilities implemented
    Steps:
      1. Run script that calls writeToFile("test content", "/tmp/apidocs2ai-test-output.txt")
      2. Read `/tmp/apidocs2ai-test-output.txt`
      3. Assert content equals "test content"
      4. Clean up temp file
    Expected Result: File contains exact output string
    Failure Indicators: File missing, content mismatch, permissions error
    Evidence: .sisyphus/evidence/task-4-file-output.txt
  ```

  **Commit**: YES
  - Message: `feat(output): add output utilities (stdout/stderr/file/clipboard)`
  - Files: `src/output/**`
  - Pre-commit: `bun test`

- [x] 5. Parser Adapter (@scalar/openapi-parser wrapper)

  **What to do**:
  - TDD: Write tests first in `tests/unit/parser.test.ts`
  - Create `src/parser/loader.ts`: Input loading logic
    - `loadFromFile(path: string)` → read file via `@scalar/json-magic/bundle` with `readFiles`, `parseJson`, `parseYaml` plugins
    - `loadFromUrl(url: string)` → fetch via `fetchUrls` plugin
    - `loadFromStdin()` → read from `process.stdin` with 500ms timeout guard (Gemini CLI pattern)
    - Auto-detect input source: file path vs URL (starts with http) vs stdin (no arg + piped)
  - Create `src/parser/adapter.ts`: Parser adapter wrapping @scalar/openapi-parser
    - `parseSpec(input: string | Buffer)` → parse, detect version, upgrade 2.0/3.0 → 3.1 via `upgrade()`, dereference all $refs
    - Handle circular refs: detect cycles post-dereference, break with `$circular_ref: true` marker
    - Return: `{ spec: DereferencedSpec, version: string, warnings: string[] }`
    - Validation: default lenient (warn on stderr, proceed). `--strict` rejects with exit code 4
  - Create `src/parser/index.ts`: barrel export with main `loadAndParse(input: string, options: ParseOptions)` function
  - MUST NOT use deprecated `load()` from `@scalar/openapi-parser`

  **Must NOT do**:
  - No `load()` from @scalar/openapi-parser (deprecated)
  - No `import.meta.url` (broken in Bun compile)
  - No caching or optimization (keep simple for v0)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex integration with external library, version detection, circular ref handling, stdin timeout
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: Tasks 6, 7, 8, 9, 10
  - **Blocked By**: Tasks 1, 2

  **References**:
  **External References**:
  - @scalar/openapi-parser API: `import { validate, dereference } from '@scalar/openapi-parser'` — core functions
  - @scalar/json-magic bundle: `import { bundle } from '@scalar/json-magic/bundle'` with plugins `readFiles`, `fetchUrls`, `parseJson`, `parseYaml` from `@scalar/json-magic/bundle/plugins/node`
  - @scalar/openapi-upgrader: `import { upgrade } from '@scalar/openapi-upgrader'` — converts 2.0→3.0→3.1
  - Gemini CLI stdin pattern: 500ms timeout guard when no TTY detected — `https://github.com/google-gemini/gemini-cli`
  - Circular ref handling: WeakSet-based cycle detection, break with marker object

  **Acceptance Criteria**:
  - [ ] `tests/unit/parser.test.ts` passes with all test cases
  - [ ] Petstore 3.0 YAML loads and parses correctly
  - [ ] Petstore 2.0 JSON loads, upgrades to 3.1, and parses
  - [ ] URL loading works (test with mock or real Petstore URL)
  - [ ] Stdin loading works with piped input
  - [ ] Circular refs don't cause infinite loops
  - [ ] Lenient mode: invalid spec produces warnings but returns parsed result
  - [ ] Strict mode: invalid spec throws with exit code 4
  - [ ] `load()` is NOT used anywhere (grep verification)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Parse Petstore 3.0 from file
    Tool: Bash
    Preconditions: Parser adapter implemented, fixtures from Task 3 available
    Steps:
      1. Run `bun -e "import { loadAndParse } from './src/parser'; const r = await loadAndParse('tests/fixtures/petstore-3.0.yaml', {}); console.log(r.version, Object.keys(r.spec.paths || {}).length)"`
      2. Assert output contains version "3.0" or "3.1" and path count > 0
    Expected Result: Spec parsed, version detected, paths present
    Failure Indicators: Parse error, version undefined, zero paths
    Evidence: .sisyphus/evidence/task-5-parse-petstore.txt

  Scenario: Swagger 2.0 auto-upgrade
    Tool: Bash
    Preconditions: Petstore 2.0 fixture available
    Steps:
      1. Run `bun -e "import { loadAndParse } from './src/parser'; const r = await loadAndParse('tests/fixtures/petstore-2.0.json', {}); console.log(r.version)"`
      2. Assert output shows upgraded version (3.1)
    Expected Result: Swagger 2.0 input upgraded to 3.1
    Failure Indicators: Version still "2.0", upgrade error
    Evidence: .sisyphus/evidence/task-5-swagger-upgrade.txt

  Scenario: Circular ref handled gracefully
    Tool: Bash
    Preconditions: Circular ref fixture available
    Steps:
      1. Run `bun -e "import { loadAndParse } from './src/parser'; const r = await loadAndParse('tests/fixtures/circular-ref.yaml', {}); console.log('OK')"` with timeout 5s
      2. Assert exits within 5s with "OK" output (no infinite loop)
    Expected Result: Parser completes without hanging
    Failure Indicators: Timeout, infinite loop, stack overflow
    Evidence: .sisyphus/evidence/task-5-circular-ref.txt

  Scenario: Deprecated load() not used
    Tool: Bash
    Preconditions: Parser code written
    Steps:
      1. Run `grep -rn "\.load(" src/parser/` — expect no matches or only non-scalar usage
    Expected Result: No usage of deprecated load() from @scalar
    Failure Indicators: Any import or call to load() from scalar packages
    Evidence: .sisyphus/evidence/task-5-no-deprecated-load.txt
  ```

  **Commit**: YES
  - Message: `feat(parser): add OpenAPI parser adapter with scalar`
  - Files: `src/parser/**`
  - Pre-commit: `bun test`

- [x] 6. LAPIS Formatter — [meta] + [types] Sections

  **What to do**:
  - TDD: Write tests in `tests/unit/formatters/lapis-meta-types.test.ts` using golden file comparison
  - Study LAPIS spec (`docs/lapis-spec-v0.1.0.md`) and Python reference implementation for conversion rules
  - Create `src/formatters/lapis/meta.ts`: Generate `[meta]` section
    - Extract: API name, version, base URL (first server), auth scheme
    - Format: key-value pairs per LAPIS spec
    - Truncate descriptions to 80 chars
  - Create `src/formatters/lapis/types.ts`: Generate `[types]` section
    - Resolve all schemas from components/schemas
    - Deduplicate: schemas referenced >1 time → named type
    - Inline: schemas referenced once → inline at usage point
    - Flatten allOf/oneOf/anyOf into compact notation
    - Compact enums: `"a" | "b" | "c"` syntax
    - Handle nested objects with indentation
  - Create `src/formatters/lapis/index.ts`: LAPIS formatter that implements `Formatter` interface
    - Output header: `# LAPIS v0.1.0`
    - Combine sections in order: meta, types, (ops/webhooks/errors in Task 7)
  - Test against golden file: Petstore 3.0 [meta] and [types] sections

  **Must NOT do**:
  - No inventing LAPIS syntax beyond spec
  - No [flows] or [limits] sections
  - No [ops]/[webhooks]/[errors] (Task 7)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex format conversion, requires deep understanding of LAPIS spec and OpenAPI schema model
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8, 9)
  - **Blocks**: Tasks 10, 13
  - **Blocked By**: Tasks 2, 3, 5

  **References**:
  **Pattern References**:
  - `docs/lapis-spec-v0.1.0.md` — Full LAPIS spec, [meta] and [types] section grammar
  - `tests/fixtures/petstore-3.0-expected.lapis` — Golden file for comparison

  **External References**:
  - LAPIS Python impl: `https://github.com/cr0hn/LAPIS/tree/main/tools/python/src/lapis_spec` — conversion logic, especially schema deduplication and allOf flattening
  - LAPIS spec rules: resolve $ref → flatten allOf → deduplicate schemas (>1 ref = named type) → truncate descriptions 80 chars

  **Acceptance Criteria**:
  - [ ] `tests/unit/formatters/lapis-meta-types.test.ts` passes
  - [ ] [meta] section generates correctly from Petstore spec
  - [ ] [types] section correctly deduplicates and flattens schemas
  - [ ] Descriptions truncated to 80 chars
  - [ ] Enum values use compact `"a" | "b" | "c"` syntax
  - [ ] Implements `Formatter` interface from `src/types`
  - [ ] Golden file comparison passes for meta + types sections

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: LAPIS [meta] section from Petstore
    Tool: Bash
    Preconditions: Formatter and parser complete
    Steps:
      1. Run formatter on Petstore 3.0 fixture, extract [meta] section
      2. Assert contains API name "Swagger Petstore"
      3. Assert contains version
      4. Assert contains base URL
      5. Assert no description exceeds 80 chars
    Expected Result: Valid [meta] section per LAPIS spec
    Failure Indicators: Missing fields, descriptions > 80 chars, wrong format
    Evidence: .sisyphus/evidence/task-6-lapis-meta.txt

  Scenario: Schema deduplication in [types]
    Tool: Bash
    Preconditions: Formatter implemented
    Steps:
      1. Run formatter on Petstore spec which has Pet, Category, Tag schemas
      2. Assert schemas referenced >1 time appear as named types in [types]
      3. Assert no duplicate type definitions
    Expected Result: Each multi-use schema defined exactly once
    Failure Indicators: Duplicate definitions, missing types, inline where should be named
    Evidence: .sisyphus/evidence/task-6-lapis-types.txt
  ```

  **Commit**: YES
  - Message: `feat(lapis): add LAPIS formatter meta + types sections`
  - Files: `src/formatters/lapis/**`
  - Pre-commit: `bun test`

- [x] 7. LAPIS Formatter — [ops] + [webhooks] + [errors] Sections

  **What to do**:
  - TDD: Write tests in `tests/unit/formatters/lapis-ops-errors.test.ts` using golden file comparison
  - Create `src/formatters/lapis/ops.ts`: Generate `[ops]` section
    - For each operation: `operationId METHOD /path` signature line
    - Description: 1-line summary, truncated to 80 chars
    - Parameters: `> param_name: type` (indicate required with no `?`, optional with `?`)
    - Infer param location: GET → query by default, POST/PUT/PATCH → body by default. Only show location if non-default
    - Request body: `> body_field: type`
    - Response: `< ResponseType` (success response only)
    - Group by tag if tags present
  - Create `src/formatters/lapis/webhooks.ts`: Generate `[webhooks]` section
    - Similar to ops but for webhook definitions
    - Many specs have no webhooks — handle empty gracefully (omit section)
  - Create `src/formatters/lapis/errors.ts`: Generate `[errors]` section
    - Collect ALL error responses across all operations
    - Deduplicate by (status_code, schema)
    - Emit each unique error once: `code: schema_description`
    - Track how many operations reference each error (comment)
  - Update `src/formatters/lapis/index.ts` to combine ALL sections
  - Full golden file comparison: complete LAPIS output for Petstore spec

  **Must NOT do**:
  - No [flows] or [limits] sections
  - No per-operation error listings (centralized only)
  - No inventing syntax beyond LAPIS spec

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex operation traversal, error deduplication logic, golden file matching
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 8, 9)
  - **Blocks**: Tasks 10, 13
  - **Blocked By**: Tasks 2, 3, 5

  **References**:
  **Pattern References**:
  - `docs/lapis-spec-v0.1.0.md` — [ops], [webhooks], [errors] section grammar
  - `tests/fixtures/petstore-3.0-expected.lapis` — Golden file for full output comparison
  - `src/formatters/lapis/meta.ts` (Task 6) — Follow same patterns for consistency

  **External References**:
  - LAPIS Python impl: `https://github.com/cr0hn/LAPIS/tree/main/tools/python/src/lapis_spec` — operation conversion, error centralization
  - LAPIS paper Table 4: Petstore should compress from 4,634 to ~800 tokens (82.7%)

  **Acceptance Criteria**:
  - [ ] `tests/unit/formatters/lapis-ops-errors.test.ts` passes
  - [ ] Operations use signature syntax: `operationId METHOD /path`
  - [ ] Parameters show `>` prefix with type and optionality
  - [ ] Responses show `<` prefix with type
  - [ ] Errors centralized: no duplicate error definitions
  - [ ] Empty webhooks → section omitted
  - [ ] Full golden file comparison passes for complete Petstore LAPIS output
  - [ ] Token count of LAPIS output is <30% of input spec tokens (≥70% reduction)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Full Petstore LAPIS output matches golden file
    Tool: Bash
    Preconditions: All LAPIS sections implemented
    Steps:
      1. Run full LAPIS formatter on Petstore 3.0 fixture
      2. Compare output with `tests/fixtures/petstore-3.0-expected.lapis`
      3. Diff should be empty or only whitespace differences
    Expected Result: Output matches golden file
    Failure Indicators: Structural differences, missing operations, wrong syntax
    Evidence: .sisyphus/evidence/task-7-lapis-golden.txt

  Scenario: Error deduplication works
    Tool: Bash
    Preconditions: Formatter implemented
    Steps:
      1. Run formatter on Petstore (which has repeated 404/400 errors across operations)
      2. Count unique error entries in [errors] section
      3. Assert count is significantly less than total error responses across all operations
    Expected Result: Errors deduplicated — e.g., one "404" entry instead of N
    Failure Indicators: Duplicate error entries, errors still per-operation
    Evidence: .sisyphus/evidence/task-7-error-dedup.txt

  Scenario: Token reduction meets threshold
    Tool: Bash
    Preconditions: Full LAPIS formatter complete
    Steps:
      1. Count chars in Petstore 3.0 YAML fixture
      2. Count chars in LAPIS output
      3. Calculate reduction ratio: (1 - lapis_chars/yaml_chars) * 100
      4. Assert ≥70% character reduction (proxy for token reduction)
    Expected Result: ≥70% character reduction
    Failure Indicators: Less than 70% reduction
    Evidence: .sisyphus/evidence/task-7-token-reduction.txt
  ```

  **Commit**: YES
  - Message: `feat(lapis): add LAPIS formatter ops + webhooks + errors sections`
  - Files: `src/formatters/lapis/**`
  - Pre-commit: `bun test`

- [x] 8. Filtered JSON Formatter

  **What to do**:
  - TDD: Write tests in `tests/unit/formatters/json.test.ts`
  - Create `src/formatters/json/index.ts`: Filtered JSON formatter implementing `Formatter` interface
    - Start from dereferenced OpenAPI spec
    - Strip fields: `info.contact`, `info.license`, `info.termsOfService`, `externalDocs`, `x-*` extensions, `xml` annotations, `discriminator`, `examples`, `example` (on schemas), response `headers`, multiple `servers` (keep first only)
    - Keep fields: `info.title`, `info.version`, `info.description` (truncated), `paths`, `components/schemas` (if referenced), `servers[0]`, `security`, `tags` (names only, no descriptions)
    - Compact JSON: minified output (no pretty-print by default)
    - Option: `--pretty` for human-readable JSON (but default is minified for token savings)
  - Expected reduction: ~40-50% from full OpenAPI JSON

  **Must NOT do**:
  - No structural redesign (that's LAPIS's job)
  - No custom DSL elements in JSON output
  - No validation or error generation (just filtering)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Moderate complexity, recursive field stripping, but well-defined scope
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7, 9)
  - **Blocks**: Tasks 10, 13
  - **Blocked By**: Tasks 2, 5

  **References**:
  **External References**:
  - LLM-OpenAPI-minifier approach: `https://github.com/ShelbyJenkins/LLM-OpenAPI-minifier` — field stripping reference
  - Metis analysis: Strip info.contact, license, termsOfService, externalDocs, x-*, xml, discriminator, examples

  **Acceptance Criteria**:
  - [ ] `tests/unit/formatters/json.test.ts` passes
  - [ ] Stripped fields not present in output
  - [ ] Essential fields preserved
  - [ ] Output is valid JSON
  - [ ] Minified by default
  - [ ] Implements `Formatter` interface
  - [ ] ~40-50% size reduction from original JSON spec

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Filtered JSON strips noise fields
    Tool: Bash
    Preconditions: Formatter implemented
    Steps:
      1. Run filtered JSON formatter on Petstore 3.0
      2. Parse output as JSON
      3. Assert `info.contact` is absent
      4. Assert `info.title` is present
      5. Assert no keys starting with `x-`
      6. Assert `paths` is present with operations
    Expected Result: Noise stripped, essentials kept, valid JSON
    Failure Indicators: Noise fields present, essential fields missing, invalid JSON
    Evidence: .sisyphus/evidence/task-8-json-filter.txt

  Scenario: JSON output achieves ~40% reduction
    Tool: Bash
    Preconditions: Formatter implemented
    Steps:
      1. Get byte size of original Petstore JSON
      2. Get byte size of filtered JSON output
      3. Calculate reduction: (1 - filtered/original) * 100
      4. Assert ≥35% byte reduction
    Expected Result: Meaningful size reduction
    Failure Indicators: Less than 35% reduction
    Evidence: .sisyphus/evidence/task-8-json-reduction.txt
  ```

  **Commit**: YES
  - Message: `feat(format): add filtered JSON formatter`
  - Files: `src/formatters/json/**`
  - Pre-commit: `bun test`

- [x] 9. Markdown Formatter

  **What to do**:
  - TDD: Write tests in `tests/unit/formatters/markdown.test.ts`
  - Create `src/formatters/markdown/index.ts`: Markdown formatter implementing `Formatter` interface
    - Header: API name, version, description (truncated), base URL
    - Auth section: authentication schemes
    - Endpoints table: `| Method | Path | Summary | Params |` for quick scan
    - Detailed sections per tag/group:
      - Operation heading: `### operationId — METHOD /path`
      - Parameters: bullet list with type and required flag
      - Request body: schema as compact bullet list
      - Response: success response schema as bullet list
    - Types section: shared schemas as definitions
    - Skip: errors (too verbose for markdown), examples, verbose descriptions
  - Target: ~60% token reduction, highly readable by chat-based AI

  **Must NOT do**:
  - No HTML in markdown
  - No images or external links
  - No per-operation error listings

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Moderate complexity, well-defined output structure
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7, 8)
  - **Blocks**: Tasks 10, 13
  - **Blocked By**: Tasks 2, 5

  **References**:
  **External References**:
  - SWAGENT markdown approach: `https://github.com/X24Labs/SWAGENT` — markdown format reference for API docs
  - Markdown table syntax: `| Header | Header |` with `|---|---|` separator

  **Acceptance Criteria**:
  - [ ] `tests/unit/formatters/markdown.test.ts` passes
  - [ ] Output is valid markdown
  - [ ] Endpoints table present with correct columns
  - [ ] Each operation has heading, params, response
  - [ ] Implements `Formatter` interface
  - [ ] Readable and useful for chat-based AI (not just raw dump)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Markdown output is well-structured
    Tool: Bash
    Preconditions: Formatter implemented
    Steps:
      1. Run markdown formatter on Petstore 3.0
      2. Assert output starts with `# ` heading (API name)
      3. Assert contains markdown table with `| Method |`
      4. Assert contains `### ` headings for operations
      5. Assert contains parameter lists with `- ` bullets
    Expected Result: Well-structured markdown with tables and headings
    Failure Indicators: Missing structure, no tables, no headings
    Evidence: .sisyphus/evidence/task-9-markdown-structure.txt

  Scenario: Markdown achieves ~60% reduction
    Tool: Bash
    Preconditions: Formatter implemented
    Steps:
      1. Get char count of original Petstore YAML
      2. Get char count of markdown output
      3. Calculate reduction
      4. Assert ≥50% reduction
    Expected Result: Meaningful size reduction while maintaining readability
    Failure Indicators: Less than 50% reduction or unreadable output
    Evidence: .sisyphus/evidence/task-9-markdown-reduction.txt
  ```

  **Commit**: YES
  - Message: `feat(format): add markdown formatter`
  - Files: `src/formatters/markdown/**`
  - Pre-commit: `bun test`

- [x] 10. CLI Layer (Commander.js + stdin + TTY + exit codes)

  **What to do**:
  - TDD: Write tests in `tests/unit/cli.test.ts`
  - Create `src/cli/commands.ts`: Main command definition
    - `apidocs2ai <input> [options]` — flat structure, no subcommands
    - Options:
      - `--format <type>` — output format: `lapis` (default), `json`, `markdown` (aliases: `-f`)
      - `--output <path>` — write to file instead of stdout (alias: `-o`)
      - `--copy` — copy to clipboard (alias: `-c`)
      - `--strict` — reject invalid specs (default: lenient)
      - `--json` — force JSON structured output envelope (for AI agents)
      - `--pretty` — pretty-print output (JSON format only)
      - `--version` — show version
      - `--help` — show rich help with examples
    - Input detection: file path (default), URL (starts with http/https), stdin (no arg + piped)
  - Create `src/cli/pipeline.ts`: Core pipeline orchestration
    - `runPipeline(input: string, options: CliOptions)` → load → parse → format → output
    - Error handling: catch all errors, map to appropriate exit codes
    - Warnings: emit to stderr
    - Progress: emit to stderr only if TTY
  - Create `src/cli/stdin.ts`: Stdin reader with 500ms timeout guard
    - If no input arg and `!process.stdin.isTTY` → read from stdin
    - If no input arg and `process.stdin.isTTY` → show help (no hanging)
    - Timeout guard: if stdin doesn't produce data in 500ms, abort with helpful message
  - Update `src/cli.ts`: Entry point that wires Commander + pipeline
  - Rich `--help` output with examples:
    ```
    Usage: apidocs2ai [options] <input>

    Convert OpenAPI/Swagger specs to AI-friendly formats.

    Arguments:
      input                    Path, URL, or pipe OpenAPI spec (JSON/YAML)

    Options:
      -f, --format <type>      Output format: lapis, json, markdown (default: "lapis")
      -o, --output <path>      Write to file instead of stdout
      -c, --copy               Copy output to clipboard
      --strict                 Reject specs that fail validation
      --json                   Structured JSON output envelope
      --pretty                 Pretty-print JSON output
      -V, --version            Output the version number
      -h, --help               Display help

    Examples:
      $ apidocs2ai openapi.yaml                    # LAPIS format to stdout
      $ apidocs2ai openapi.yaml -f markdown        # Markdown format
      $ apidocs2ai https://api.example.com/spec    # From URL
      $ cat openapi.yaml | apidocs2ai              # From stdin
      $ apidocs2ai openapi.yaml -o compressed.lapis  # To file
      $ apidocs2ai openapi.yaml --copy             # To clipboard
    ```

  **Must NOT do**:
  - No subcommands (flat CLI)
  - No interactive prompts (agent-unfriendly)
  - No spinner/progress bar libraries
  - No `import.meta.url` for path resolution

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex CLI wiring, stdin handling with timeout, error mapping, TTY detection
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12, 13)
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Tasks 2, 4, 6, 7, 8, 9

  **References**:
  **Pattern References**:
  - `src/types/config.ts` (Task 2) — `CliOptions` type definition
  - `src/output/` (Task 4) — output destination functions
  - `src/parser/` (Task 5) — `loadAndParse()` function
  - `src/formatters/` (Tasks 6-9) — formatter implementations

  **External References**:
  - Commander.js v12: `https://github.com/tj/commander.js` — command definition, options, help customization
  - Agentic CLI design: `https://dev.to/tumf/agentic-cli-design-7-principles-for-designing-cli-as-a-protocol-for-ai-agents-2c10` — TTY detection, exit codes, stdout/stderr discipline
  - Gemini CLI stdin: 500ms timeout guard pattern for stdin

  **Acceptance Criteria**:
  - [ ] `tests/unit/cli.test.ts` passes
  - [ ] `apidocs2ai --help` shows rich help with examples
  - [ ] `apidocs2ai --version` shows version from package.json
  - [ ] `apidocs2ai spec.yaml` outputs LAPIS by default
  - [ ] `apidocs2ai spec.yaml -f json` outputs filtered JSON
  - [ ] `apidocs2ai spec.yaml -f markdown` outputs markdown
  - [ ] `apidocs2ai spec.yaml -o /tmp/out.lapis` writes to file
  - [ ] `apidocs2ai spec.yaml --copy` copies to clipboard
  - [ ] `apidocs2ai https://...` fetches from URL
  - [ ] `cat spec.yaml | apidocs2ai` reads from stdin
  - [ ] Exit codes: 0 success, 2 bad args, 3 not found, 4 parse error, 5 network error
  - [ ] `--json` wraps output in `{ok: true, data: ...}` envelope
  - [ ] No data on stderr, no errors on stdout

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: CLI help output is rich and AI-parseable
    Tool: Bash
    Preconditions: CLI wired up
    Steps:
      1. Run `bun run src/cli.ts --help`
      2. Assert output contains "Usage:", "Arguments:", "Options:", "Examples:"
      3. Assert contains at least 3 example commands
      4. Assert exit code is 0
    Expected Result: Rich help with all sections
    Failure Indicators: Missing sections, no examples, non-zero exit
    Evidence: .sisyphus/evidence/task-10-cli-help.txt

  Scenario: Exit codes are correct for error conditions
    Tool: Bash
    Preconditions: CLI complete
    Steps:
      1. Run `bun run src/cli.ts nonexistent.yaml 2>/dev/null; echo $?` — expect 3 (not found)
      2. Run `bun run src/cli.ts tests/fixtures/invalid.yaml 2>/dev/null; echo $?` — expect 4 (parse error)
      3. Run `bun run src/cli.ts --format invalid 2>/dev/null; echo $?` — expect 2 (bad args)
      4. Run `bun run src/cli.ts tests/fixtures/petstore-3.0.yaml 2>/dev/null; echo $?` — expect 0 (success)
    Expected Result: Correct exit code for each error type
    Failure Indicators: Wrong exit codes, exit 1 for everything
    Evidence: .sisyphus/evidence/task-10-exit-codes.txt

  Scenario: stdout/stderr separation with --json flag
    Tool: Bash
    Preconditions: CLI complete
    Steps:
      1. Run `bun run src/cli.ts tests/fixtures/petstore-3.0.yaml --json 2>/dev/null`
      2. Pipe stdout to `bun -e "const j = JSON.parse(await Bun.stdin.text()); console.log(j.ok)"`
      3. Assert outputs "true"
    Expected Result: JSON envelope on stdout, parseable by downstream tools
    Failure Indicators: Invalid JSON, missing ok field, errors on stdout
    Evidence: .sisyphus/evidence/task-10-json-envelope.txt

  Scenario: Stdin with no input shows help (not hang)
    Tool: Bash
    Preconditions: CLI complete
    Steps:
      1. Run `echo "" | timeout 3 bun run src/cli.ts 2>/dev/null; echo $?`
      2. Assert completes within 3s (no hanging)
    Expected Result: CLI exits within timeout, shows help or error
    Failure Indicators: Hangs indefinitely waiting for stdin
    Evidence: .sisyphus/evidence/task-10-stdin-timeout.txt
  ```

  **Commit**: YES
  - Message: `feat(cli): add Commander.js CLI with stdin + TTY + exit codes`
  - Files: `src/cli.ts, src/cli/**`
  - Pre-commit: `bun test`

- [x] 11. AGENTS.md + CLAUDE.md for AI Discoverability

  **What to do**:
  - Create `AGENTS.md` in repo root: AI agent instruction file
    - Tool name and purpose
    - Installation methods (npm, npx, binary)
    - Complete command reference with all options
    - Input/output format documentation
    - Example workflows (common use cases)
    - Exit code reference table
    - Structured output schema (--json envelope)
    - Pipe-friendly usage patterns
    - Error handling guide
  - Create `CLAUDE.md` in repo root: Claude-specific context
    - Project overview for Claude Code sessions
    - Architecture summary (pipeline: load → parse → format → output)
    - Development commands (test, build, run)
    - Key files and their responsibilities
    - Testing patterns used
    - Contribution guidelines

  **Must NOT do**:
  - No marketing language
  - No emojis
  - No redundant info already in README
  - Focus AGENTS.md on machine-parseable instruction, not human storytelling

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation-focused task, needs clear technical writing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 12, 13)
  - **Blocks**: None
  - **Blocked By**: Task 10 (needs final CLI interface to document)

  **References**:
  **Pattern References**:
  - `src/cli.ts` (Task 10) — CLI interface to document
  - `src/types/errors.ts` (Task 2) — Exit code enum for reference table

  **External References**:
  - AGENTS.md convention: Agent instruction files in repo root for AI tool discovery
  - CLAUDE.md convention: Claude Code project context files
  - Agentic CLI design: `https://dev.to/tumf/agentic-cli-design-7-principles-for-designing-cli-as-a-protocol-for-ai-agents-2c10`

  **Acceptance Criteria**:
  - [ ] `AGENTS.md` exists at repo root
  - [ ] `CLAUDE.md` exists at repo root
  - [ ] AGENTS.md contains: tool name, install, all commands, all options, examples, exit codes, output schema
  - [ ] CLAUDE.md contains: architecture, dev commands, key files, testing patterns
  - [ ] No marketing language or emojis
  - [ ] All documented commands actually work (verified against CLI)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: AGENTS.md covers all CLI options
    Tool: Bash
    Preconditions: AGENTS.md written
    Steps:
      1. Extract all flags from `bun run src/cli.ts --help`
      2. Verify each flag is documented in AGENTS.md
      3. Verify at least 3 example commands in AGENTS.md
      4. Verify exit code table in AGENTS.md
    Expected Result: 100% of CLI flags documented, examples present, exit codes listed
    Failure Indicators: Missing flags, no examples, no exit codes
    Evidence: .sisyphus/evidence/task-11-agents-coverage.txt

  Scenario: CLAUDE.md has accurate dev commands
    Tool: Bash
    Preconditions: CLAUDE.md written
    Steps:
      1. Read CLAUDE.md
      2. Verify "bun test" command mentioned
      3. Verify architecture description present
      4. Verify key files listed match actual project structure
    Expected Result: Accurate project context for Claude sessions
    Failure Indicators: Wrong commands, outdated architecture, missing key files
    Evidence: .sisyphus/evidence/task-11-claude-accuracy.txt
  ```

  **Commit**: YES
  - Message: `docs(ai): add AGENTS.md and CLAUDE.md for AI discoverability`
  - Files: `AGENTS.md, CLAUDE.md`
  - Pre-commit: —

- [x] 12. README.md

  **What to do**:
  - Create comprehensive `README.md` with:
    - **Header**: Project name, tagline, badges (npm version, license, CI status, downloads)
    - **What & Why**: What the tool does, why token reduction matters (cite LAPIS 85% stat)
    - **Quick Start**: 3-line install + first use
    - **Installation**: npm/npx, Bun binary download, build from source
    - **Usage**: All commands with examples
      - Basic: `apidocs2ai spec.yaml`
      - Formats: `--format lapis|json|markdown`
      - Output: stdout, `--output`, `--copy`
      - Input: file, URL, stdin pipe
      - Options: `--strict`, `--json`, `--pretty`
    - **Output Formats**: Explain each format with before/after examples
      - LAPIS: show OpenAPI input → LAPIS output side-by-side, explain 85% reduction
      - Filtered JSON: what's stripped, what's kept
      - Markdown: structure and use case
    - **AI Integration**: How to use with AI agents
      - Claude Code: add to AGENTS.md
      - ChatGPT: pipe output to clipboard
      - Generic: `--json` flag for structured output
    - **Supported Specs**: OpenAPI 3.0, 3.1, Swagger 2.0
    - **Exit Codes**: Reference table
    - **Contributing**: How to contribute, dev setup, test commands
    - **License**: MIT
    - **Acknowledgments**: LAPIS spec (cr0hn), @scalar/openapi-parser
  - Honest about binary sizes (Linux ~100MB, macOS ~60MB)

  **Must NOT do**:
  - No emojis in headings
  - No marketing fluff
  - No claiming "lightweight" for binaries
  - No screenshots (CLI tool)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation, needs clear structure and accurate technical writing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11, 13)
  - **Blocks**: None
  - **Blocked By**: Task 10 (needs final CLI interface)

  **References**:
  **Pattern References**:
  - `src/cli.ts` (Task 10) — CLI commands and options to document
  - `docs/lapis-spec-v0.1.0.md` (Task 3) — LAPIS format reference
  - `tests/fixtures/petstore-3.0-expected.lapis` (Task 3) — Example output to show

  **External References**:
  - LAPIS paper stats: Petstore 82.7% reduction, GitHub 82.7%, DigitalOcean 90.8%, Twilio 92.1%
  - npm badge: `https://img.shields.io/npm/v/apidocs2ai`
  - Best README practices: clear structure, quick start first, details after

  **Acceptance Criteria**:
  - [ ] README.md exists at repo root
  - [ ] Contains: quick start, installation (3 methods), usage, all options, format examples, AI integration, exit codes, contributing, license
  - [ ] Before/after examples for LAPIS format
  - [ ] Binary sizes documented honestly
  - [ ] LAPIS paper cited with reduction stats
  - [ ] No emojis, no marketing fluff

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: README has all required sections
    Tool: Bash
    Preconditions: README written
    Steps:
      1. Read README.md
      2. Assert contains: "Quick Start", "Installation", "Usage", "Output Formats", "AI Integration", "Exit Codes", "Contributing", "License"
      3. Assert contains code blocks with example commands
      4. Assert contains LAPIS before/after example
    Expected Result: All sections present with examples
    Failure Indicators: Missing sections, no code examples, no before/after
    Evidence: .sisyphus/evidence/task-12-readme-sections.txt
  ```

  **Commit**: YES
  - Message: `docs: add comprehensive README`
  - Files: `README.md`
  - Pre-commit: —

- [x] 13. Integration Tests (End-to-End CLI)

  **What to do**:
  - Create `tests/e2e/cli.test.ts`: Full end-to-end tests of CLI pipeline
    - Test file input → LAPIS output (default format)
    - Test file input → JSON output (`--format json`)
    - Test file input → markdown output (`--format markdown`)
    - Test URL input (use real Petstore URL or mock server)
    - Test stdin input (pipe file content)
    - Test `--output` flag (verify file created with correct content)
    - Test `--copy` flag (mock clipboard command)
    - Test `--json` flag (verify envelope structure)
    - Test `--strict` flag with invalid spec (expect exit 4)
    - Test Swagger 2.0 input (verify upgrade + conversion)
    - Test nonexistent file (expect exit 3)
    - Test invalid format arg (expect exit 2)
    - Test circular ref spec (no hang, completes)
    - Test minimal spec (1 endpoint, verify output)
    - Test `--help` (verify contains examples)
    - Test `--version` (verify matches package.json)
  - All tests run the actual CLI entry point via `Bun.spawn` or `child_process.exec`
  - Each test verifies: exit code, stdout content, stderr content (or absence)

  **Must NOT do**:
  - No mocking core logic (test real pipeline)
  - No skipping slow tests (URL fetch can use fixture as fallback)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive test suite, needs understanding of all components
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11, 12)
  - **Blocks**: Task 14
  - **Blocked By**: Tasks 3, 6, 7, 8, 9, 10

  **References**:
  **Pattern References**:
  - `src/cli.ts` (Task 10) — entry point to test
  - `tests/fixtures/` (Task 3) — all test fixtures
  - `src/types/errors.ts` (Task 2) — exit codes to verify

  **External References**:
  - Bun.spawn: `https://bun.sh/docs/api/spawn` — spawning CLI process for e2e tests
  - Bun test: `https://bun.sh/docs/cli/test` — test runner API

  **Acceptance Criteria**:
  - [ ] `tests/e2e/cli.test.ts` passes with all test cases
  - [ ] ≥16 test cases covering all input/output combinations
  - [ ] Every exit code tested (0, 2, 3, 4, 5)
  - [ ] All 3 formats tested (lapis, json, markdown)
  - [ ] All 3 input sources tested (file, URL, stdin)
  - [ ] All 3 output destinations tested (stdout, file, clipboard)
  - [ ] `--json` envelope tested
  - [ ] `--strict` flag tested
  - [ ] `--help` and `--version` tested
  - [ ] Swagger 2.0 tested
  - [ ] Circular ref tested (no hang)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Full e2e test suite passes
    Tool: Bash
    Preconditions: All components complete
    Steps:
      1. Run `bun test tests/e2e/cli.test.ts`
      2. Assert all tests pass
      3. Assert ≥16 test cases ran
    Expected Result: All integration tests green
    Failure Indicators: Any test failure, fewer than 16 tests
    Evidence: .sisyphus/evidence/task-13-e2e-results.txt

  Scenario: Real pipeline produces valid LAPIS from Petstore URL
    Tool: Bash
    Preconditions: Full CLI working
    Steps:
      1. Run `bun run src/cli.ts https://petstore3.swagger.io/api/v3/openapi.json 2>/dev/null`
      2. Assert output starts with `# LAPIS v0.1.0`
      3. Assert output contains `[meta]`
      4. Assert output contains `[ops]`
      5. Assert exit code 0
    Expected Result: Real URL → valid LAPIS output
    Failure Indicators: Network error, invalid output, non-zero exit
    Evidence: .sisyphus/evidence/task-13-real-url.txt
  ```

  **Commit**: YES
  - Message: `test(e2e): add integration tests for full CLI pipeline`
  - Files: `tests/e2e/**`
  - Pre-commit: `bun test`

- [x] 14. npm Package Setup

  **What to do**:
  - Update `package.json` for npm publishing:
    - `name`: `apidocs2ai`
    - `version`: `0.1.0`
    - `description`: Clear one-liner about what the tool does
    - `bin`: `{ "apidocs2ai": "./dist/cli.js" }`
    - `main`: `./dist/index.js` (for programmatic usage)
    - `types`: `./dist/index.d.ts`
    - `files`: `["dist", "README.md", "LICENSE", "AGENTS.md", "CLAUDE.md"]`
    - `keywords`: `["openapi", "swagger", "ai", "llm", "token", "compression", "lapis", "cli"]`
    - `repository`, `bugs`, `homepage` fields
    - `engines`: `{ "node": ">=18" }`
    - `license`: `MIT`
  - Add build scripts:
    - `build`: `bun build src/cli.ts --outdir dist --target node --format esm` (for npm)
    - `build:types`: Generate type declarations
    - `prepublishOnly`: `bun run build && bun test`
  - Add shebang handling: ensure `dist/cli.js` starts with `#!/usr/bin/env node`
  - Create `src/index.ts`: Programmatic API export
    - Export: `parseSpec`, `formatLapis`, `formatJson`, `formatMarkdown`
    - Allow programmatic usage without CLI
  - Verify: `npx . tests/fixtures/petstore-3.0.yaml` works locally

  **Must NOT do**:
  - No `import.meta.url` in dist output
  - No dev dependencies in `files` array
  - No publishing to npm yet (just setup)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Package config, build scripts, straightforward setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 15, 16, 17)
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 10, 13

  **References**:
  **External References**:
  - npm package.json docs: `https://docs.npmjs.com/cli/v10/configuring-npm/package-json`
  - Bun build target node: `https://bun.sh/docs/bundler` — `--target node` for npm compat
  - Shebang: `#!/usr/bin/env node` for cross-platform CLI scripts

  **Acceptance Criteria**:
  - [ ] `bun run build` produces `dist/cli.js` with shebang
  - [ ] `npx . tests/fixtures/petstore-3.0.yaml` works (local test)
  - [ ] `package.json` has all required fields for npm publishing
  - [ ] `src/index.ts` exports programmatic API
  - [ ] `bun run prepublishOnly` passes (build + test)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Built package works with npx
    Tool: Bash
    Preconditions: Build complete
    Steps:
      1. Run `bun run build`
      2. Run `node dist/cli.js tests/fixtures/petstore-3.0.yaml 2>/dev/null`
      3. Assert output starts with `# LAPIS v0.1.0`
      4. Assert exit code 0
    Expected Result: Built dist works via node
    Failure Indicators: Build error, node can't run dist, wrong output
    Evidence: .sisyphus/evidence/task-14-npm-build.txt

  Scenario: Programmatic API exports work
    Tool: Bash
    Preconditions: Build complete
    Steps:
      1. Create temp script: `import { parseSpec, formatLapis } from './src/index'; console.log(typeof parseSpec, typeof formatLapis)`
      2. Run with bun
      3. Assert output is "function function"
    Expected Result: Core functions exportable for programmatic use
    Failure Indicators: Import errors, undefined exports
    Evidence: .sisyphus/evidence/task-14-programmatic-api.txt
  ```

  **Commit**: YES
  - Message: `chore(npm): configure package.json for npm distribution`
  - Files: `package.json, src/index.ts, dist/**`
  - Pre-commit: `bun test`

- [x] 15. GitHub Actions CI (test on push/PR)

  **What to do**:
  - Create `.github/workflows/ci.yml`:
    - Trigger: push to main, pull requests
    - Matrix: Run on `ubuntu-latest` with Bun (latest)
    - Steps: checkout → setup bun → install → test → build
    - Cache: `~/.bun/install/cache`
  - Ensure `bun test` runs all unit + e2e tests
  - Ensure `bun run build` succeeds
  - Add status badge to README (update in Task 12's README)

  **Must NOT do**:
  - No multi-OS matrix (Bun tests run fine on Linux)
  - No deployment in CI (that's release workflow)
  - No secrets or tokens needed

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard GitHub Actions YAML, well-documented patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 16, 17)
  - **Blocks**: Task 16
  - **Blocked By**: Task 1

  **References**:
  **External References**:
  - Bun GitHub Action: `https://bun.sh/guides/runtime/cicd` — official CI setup
  - GitHub Actions docs: `https://docs.github.com/en/actions`

  **Acceptance Criteria**:
  - [ ] `.github/workflows/ci.yml` exists
  - [ ] Triggers on push to main and PRs
  - [ ] Runs `bun test` and `bun run build`
  - [ ] Uses Bun caching
  - [ ] YAML is valid (no syntax errors)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: CI workflow YAML is valid
    Tool: Bash
    Preconditions: Workflow file created
    Steps:
      1. Read `.github/workflows/ci.yml`
      2. Verify it has `on:` trigger with `push` and `pull_request`
      3. Verify it has `bun test` step
      4. Verify it has `bun run build` step
      5. Verify valid YAML (parse with bun)
    Expected Result: Valid workflow with test and build steps
    Failure Indicators: YAML syntax error, missing triggers, missing steps
    Evidence: .sisyphus/evidence/task-15-ci-yaml.txt
  ```

  **Commit**: YES (groups with 16)
  - Message: `ci: add GitHub Actions for test + release with binaries`
  - Files: `.github/workflows/**`
  - Pre-commit: —

- [x] 16. GitHub Actions Release (binary builds + npm publish)

  **What to do**:
  - Create `.github/workflows/release.yml`:
    - Trigger: push tags matching `v*` (e.g., `v0.1.0`)
    - Jobs:
      1. **Test**: Run full test suite first
      2. **Build binaries**: After test passes, build 5 targets from single `ubuntu-latest` runner:
         - `bun build --compile --minify --target=bun-darwin-arm64 src/cli.ts --outfile apidocs2ai-darwin-arm64`
         - `bun build --compile --minify --target=bun-darwin-x64 src/cli.ts --outfile apidocs2ai-darwin-x64`
         - `bun build --compile --minify --target=bun-linux-x64 src/cli.ts --outfile apidocs2ai-linux-x64`
         - `bun build --compile --minify --target=bun-linux-arm64 src/cli.ts --outfile apidocs2ai-linux-arm64`
         - `bun build --compile --minify --target=bun-windows-x64 src/cli.ts --outfile apidocs2ai-windows-x64.exe`
      3. **Create GitHub Release**: Upload all 5 binaries as release assets
      4. **Publish npm**: `npm publish` (needs NPM_TOKEN secret)
    - Include checksums: generate SHA256 for each binary
    - Release notes: auto-generate from commits since last tag

  **Must NOT do**:
  - No UPX compression (doesn't work with Bun compile output)
  - No code signing (complexity for v0)
  - No publishing without tag (accidental publish prevention)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: GitHub Actions YAML, well-documented Bun compile patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 15, 17)
  - **Blocks**: None
  - **Blocked By**: Tasks 14, 15

  **References**:
  **External References**:
  - Bun compile targets: `https://bun.sh/docs/bundler/executables` — all 5 target names and flags
  - GitHub Release Action: `softprops/action-gh-release` — upload assets to release
  - npm publish in CI: `https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow`
  - Known gotcha: `--compile` doesn't imply `--production` — add `--minify` explicitly

  **Acceptance Criteria**:
  - [ ] `.github/workflows/release.yml` exists
  - [ ] Triggers on `v*` tags only
  - [ ] Builds all 5 platform binaries
  - [ ] Creates GitHub Release with binary assets
  - [ ] Generates SHA256 checksums
  - [ ] Publishes to npm
  - [ ] Tests run before build/publish

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Release workflow YAML is valid and complete
    Tool: Bash
    Preconditions: Workflow file created
    Steps:
      1. Read `.github/workflows/release.yml`
      2. Verify trigger: `tags: ['v*']`
      3. Verify 5 `bun build --compile` commands with correct targets
      4. Verify GitHub Release creation step
      5. Verify npm publish step
      6. Verify test step runs before build
    Expected Result: Complete release workflow with all targets
    Failure Indicators: Missing targets, no test step, no release step
    Evidence: .sisyphus/evidence/task-16-release-yaml.txt

  Scenario: Local binary build test
    Tool: Bash
    Preconditions: CLI complete
    Steps:
      1. Run `bun build --compile --minify src/cli.ts --outfile /tmp/apidocs2ai-test`
      2. Run `/tmp/apidocs2ai-test tests/fixtures/petstore-3.0.yaml 2>/dev/null`
      3. Assert output starts with `# LAPIS v0.1.0`
      4. Clean up binary
    Expected Result: Compiled binary produces correct output
    Failure Indicators: Build error, binary crash, wrong output
    Evidence: .sisyphus/evidence/task-16-binary-build.txt
  ```

  **Commit**: YES (groups with 15)
  - Message: `ci: add GitHub Actions for test + release with binaries`
  - Files: `.github/workflows/**`
  - Pre-commit: —

- [x] 17. LICENSE + .gitignore + Repo Setup

  **What to do**:
  - Create `LICENSE`: MIT license with current year and author name
  - Create `.gitignore`:
    - `node_modules/`, `dist/`, `.sisyphus/`, `*.log`
    - OS files: `.DS_Store`, `Thumbs.db`
    - IDE: `.vscode/`, `.idea/`
    - Bun: `bun.lockb` (optional — some prefer to commit it)
    - Binary outputs: `apidocs2ai-*`
    - Evidence: `.sisyphus/evidence/`
  - Initialize git: `git init` if not already
  - Create initial `.npmignore` if needed (or rely on `files` in package.json)

  **Must NOT do**:
  - No git remote setup (user handles GitHub repo creation)
  - No initial commit (user may want to review first)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Boilerplate files, trivial
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 15, 16)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately, but placed in Wave 4 for commit ordering)

  **References**:
  **External References**:
  - MIT License template: `https://opensource.org/licenses/MIT`
  - GitHub .gitignore templates: Node.js template as base

  **Acceptance Criteria**:
  - [ ] `LICENSE` exists with MIT text and correct year
  - [ ] `.gitignore` exists with all required patterns
  - [ ] `git init` completed (if not already a repo)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Git repo initialized with correct ignores
    Tool: Bash
    Preconditions: Files created
    Steps:
      1. Verify `.git/` directory exists
      2. Verify `git status` doesn't show `node_modules/` or `dist/`
      3. Verify LICENSE contains "MIT"
    Expected Result: Clean git repo with proper ignores
    Failure Indicators: No .git, ignored files showing in status, missing LICENSE
    Evidence: .sisyphus/evidence/task-17-repo-setup.txt
  ```

  **Commit**: YES
  - Message: `chore: add LICENSE, .gitignore, repo setup`
  - Files: `LICENSE, .gitignore`
  - Pre-commit: —

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `bun test` + check all source files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify stdout/stderr discipline (no data on stderr, no logging on stdout).
  Output: `Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state (`bun install`). Execute EVERY QA scenario from EVERY task. Test cross-task integration: full pipeline file→LAPIS, URL→markdown, stdin→JSON. Test edge cases: empty spec, massive spec, circular refs, Swagger 2.0, invalid YAML. Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual code. Verify 1:1 — everything in spec was built, nothing beyond spec. Check "Must NOT do" compliance (no MCP, no plugins, no over-abstraction). Flag unaccounted files.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Files | Pre-commit |
|------|--------|---------|-------|------------|
| 1 | 1 | `chore: scaffold project with Bun + TypeScript + test setup` | package.json, tsconfig.json, bunfig.toml, src/ | `bun test` |
| 1 | 2 | `feat(types): add core type definitions and interfaces` | src/types/ | `bun test` |
| 1 | 3 | `test(fixtures): add LAPIS spec reference and test fixtures` | tests/fixtures/, docs/lapis-spec-v0.1.0.md | `bun test` |
| 1 | 4 | `feat(output): add output utilities (stdout/stderr/file/clipboard)` | src/output/ | `bun test` |
| 2 | 5 | `feat(parser): add OpenAPI parser adapter with scalar` | src/parser/ | `bun test` |
| 2 | 6 | `feat(lapis): add LAPIS formatter meta + types sections` | src/formatters/lapis/ | `bun test` |
| 2 | 7 | `feat(lapis): add LAPIS formatter ops + webhooks + errors sections` | src/formatters/lapis/ | `bun test` |
| 2 | 8 | `feat(format): add filtered JSON formatter` | src/formatters/json/ | `bun test` |
| 2 | 9 | `feat(format): add markdown formatter` | src/formatters/markdown/ | `bun test` |
| 3 | 10 | `feat(cli): add Commander.js CLI with stdin + TTY + exit codes` | src/cli.ts, src/cli/ | `bun test` |
| 3 | 11 | `docs(ai): add AGENTS.md and CLAUDE.md for AI discoverability` | AGENTS.md, CLAUDE.md | — |
| 3 | 12 | `docs: add comprehensive README` | README.md | — |
| 3 | 13 | `test(e2e): add integration tests for full CLI pipeline` | tests/e2e/ | `bun test` |
| 4 | 14 | `chore(npm): configure package.json for npm distribution` | package.json, dist/ | `bun test` |
| 4 | 15-16 | `ci: add GitHub Actions for test + release with binaries` | .github/workflows/ | — |
| 4 | 17 | `chore: add LICENSE, .gitignore, repo setup` | LICENSE, .gitignore | — |

---

## Success Criteria

### Verification Commands
```bash
# Core functionality
bun test                                              # Expected: all tests pass
apidocs2ai tests/fixtures/petstore-3.0.yaml           # Expected: LAPIS output to stdout
apidocs2ai tests/fixtures/petstore-2.0.json           # Expected: Swagger 2.0 handled
apidocs2ai tests/fixtures/petstore-3.0.yaml --format json      # Expected: filtered JSON
apidocs2ai tests/fixtures/petstore-3.0.yaml --format markdown  # Expected: markdown
apidocs2ai https://petstore3.swagger.io/api/v3/openapi.json    # Expected: URL fetch works
cat tests/fixtures/petstore-3.0.yaml | apidocs2ai     # Expected: stdin works
apidocs2ai tests/fixtures/petstore-3.0.yaml --output /tmp/out.lapis  # Expected: file output
apidocs2ai nonexistent.yaml; echo $?                  # Expected: exit code 3
apidocs2ai --help                                     # Expected: rich help with examples

# Token reduction
# LAPIS output tokens < 30% of input spec tokens (≥70% reduction)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass (`bun test`)
- [ ] README complete with install, usage, examples, format docs
- [ ] AGENTS.md + CLAUDE.md present and accurate
- [ ] GitHub Actions workflows functional
- [ ] npm package publishable
- [ ] Binary builds succeed for 5 platforms
