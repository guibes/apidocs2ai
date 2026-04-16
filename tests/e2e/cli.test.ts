import { describe, it, expect } from "bun:test";
import { existsSync, unlinkSync } from "node:fs";

// Helper: spawn CLI and collect stdout/stderr/exitCode
async function runCli(args: string[], stdinData?: string, timeoutMs = 10000): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const proc = Bun.spawn(["bun", "run", "src/cli.ts", ...args], {
    stdin: stdinData !== undefined ? new TextEncoder().encode(stdinData) : "inherit",
    stdout: "pipe",
    stderr: "pipe",
    cwd: process.cwd(),
  });

  const timer = setTimeout(() => proc.kill(), timeoutMs);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(timer);

  return { stdout, stderr, exitCode };
}

describe("CLI e2e tests", () => {
  it("T1: --help shows usage and examples", async () => {
    const { stdout, exitCode } = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("Examples:");
    expect(stdout).toContain("--format");
  });

  it("T2: --version outputs version string", async () => {
    const { stdout, exitCode } = await runCli(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it("T3: file input → LAPIS output (default format)", async () => {
    const { stdout, stderr, exitCode } = await runCli(["tests/fixtures/petstore-3.0.yaml"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# LAPIS v0.1.0");
    expect(stdout).toContain("[meta]");
    expect(stdout).toContain("[ops]");
    // No data on stderr (warnings OK)
    const stderrHasData = stderr.includes("# LAPIS");
    expect(stderrHasData).toBe(false);
  });

  it("T4: file input → JSON format", async () => {
    const { stdout, exitCode } = await runCli(["tests/fixtures/petstore-3.0.yaml", "-f", "json"]);
    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();
    const parsed = JSON.parse(stdout);
    expect(parsed.info).toBeDefined();
    expect(parsed.paths).toBeDefined();
  });

  it("T5: file input → markdown format", async () => {
    const { stdout, exitCode } = await runCli(["tests/fixtures/petstore-3.0.yaml", "-f", "markdown"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# ");
    expect(stdout).toContain("| Method |");
  });

  it("T6: Swagger 2.0 input auto-upgrades and converts", async () => {
    const { stdout, exitCode } = await runCli(["tests/fixtures/petstore-2.0.json"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# LAPIS v0.1.0");
  });

  it("T7: circular-ref spec completes without hanging", async () => {
    const { stdout, exitCode } = await runCli(["tests/fixtures/circular-ref.yaml"], undefined, 8000);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# LAPIS v0.1.0");
  });

  it("T8: minimal spec (1 endpoint) converts correctly", async () => {
    const { stdout, exitCode } = await runCli(["tests/fixtures/minimal.yaml"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# LAPIS v0.1.0");
    expect(stdout).toContain("getHello");
  });

  it("T9: nonexistent file → exit code 3", async () => {
    const { exitCode } = await runCli(["nonexistent-file-xyz.yaml"]);
    expect(exitCode).toBe(3);
  });

  it("T10: invalid format argument → exit code 2", async () => {
    const { exitCode } = await runCli(["tests/fixtures/minimal.yaml", "-f", "invalid"]);
    expect(exitCode).toBe(2);
  });

  it("T11: --json flag wraps output in {ok, data} envelope", async () => {
    const { stdout, exitCode } = await runCli(["tests/fixtures/minimal.yaml", "--json"]);
    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();
    const envelope = JSON.parse(stdout);
    expect(envelope.ok).toBe(true);
    expect(typeof envelope.data).toBe("string");
    expect(envelope.format).toBeDefined();
  });

  it("T12: --output flag writes to file", async () => {
    const outPath = "/tmp/apidocs2ai-e2e-test-output.lapis";
    if (existsSync(outPath)) unlinkSync(outPath);

    const { exitCode } = await runCli(["tests/fixtures/minimal.yaml", "-o", outPath]);
    expect(exitCode).toBe(0);
    expect(existsSync(outPath)).toBe(true);

    const content = await Bun.file(outPath).text();
    expect(content).toContain("# LAPIS v0.1.0");
    unlinkSync(outPath);
  });

  it("T13: stdin input works", async () => {
    const specContent = await Bun.file("tests/fixtures/minimal.yaml").text();
    const { stdout, exitCode } = await runCli([], specContent);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# LAPIS v0.1.0");
  });

  it("T14: invalid spec with --strict → exit code 4", async () => {
    const { exitCode } = await runCli(["tests/fixtures/invalid.yaml", "--strict"]);
    expect(exitCode).toBe(4);
  });

  it("T15: --json --format json outputs valid JSON envelope with JSON data", async () => {
    const { stdout, exitCode } = await runCli(["tests/fixtures/minimal.yaml", "-f", "json", "--json"]);
    expect(exitCode).toBe(0);
    const envelope = JSON.parse(stdout);
    expect(envelope.ok).toBe(true);
    expect(envelope.format).toBe("json");
    // inner data should be parseable JSON
    expect(() => JSON.parse(envelope.data)).not.toThrow();
  });

  it("T16: LAPIS output is significantly smaller than input", async () => {
    const inputSize = (await Bun.file("tests/fixtures/petstore-3.0.yaml").arrayBuffer()).byteLength;
    const { stdout, exitCode } = await runCli(["tests/fixtures/petstore-3.0.yaml"]);
    expect(exitCode).toBe(0);
    const outputSize = new TextEncoder().encode(stdout).byteLength;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    console.log(`E2E token reduction: ${reduction}%`);
    expect(outputSize).toBeLessThan(inputSize * 0.5); // at least 50% reduction
  });

  it("T17: stderr only contains non-data content when stdout has data", async () => {
    const { stdout, stderr, exitCode } = await runCli(["tests/fixtures/minimal.yaml"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# LAPIS v0.1.0");
    // stderr should NOT contain LAPIS content
    expect(stderr).not.toContain("# LAPIS v0.1.0");
    expect(stderr).not.toContain("[meta]");
  });
});
