import { describe, it, expect } from "bun:test";
import { isTTY, shouldUseColors } from "../../src/output/tty.js";
import { formatErrorEnvelope } from "../../src/output/errors.js";
import { writeToFile } from "../../src/output/destinations.js";
import { existsSync, unlinkSync, readFileSync } from "node:fs";

describe("tty detection", () => {
  it("isTTY returns boolean", () => {
    expect(typeof isTTY()).toBe("boolean");
  });

  it("shouldUseColors respects NO_COLOR env", () => {
    const original = process.env.NO_COLOR;
    process.env.NO_COLOR = "1";
    expect(shouldUseColors()).toBe(false);
    if (original === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = original;
  });
});

describe("error envelope", () => {
  it("formatErrorEnvelope returns valid JSON with required fields", () => {
    const envelope = formatErrorEnvelope("NOT_FOUND", "File not found", "Check path", false);
    const parsed = JSON.parse(envelope);
    expect(parsed.error).toBe(true);
    expect(parsed.error_type).toBe("NOT_FOUND");
    expect(parsed.message).toBe("File not found");
    expect(parsed.hint).toBe("Check path");
    expect(parsed.retryable).toBe(false);
  });

  it("formatErrorEnvelope works without optional params", () => {
    const envelope = formatErrorEnvelope("GENERAL", "Something went wrong");
    const parsed = JSON.parse(envelope);
    expect(parsed.error).toBe(true);
    expect(parsed.error_type).toBe("GENERAL");
    expect(parsed.retryable).toBe(false);
  });
});

describe("file output", () => {
  const testPath = "/tmp/apidocs2ai-output-test.txt";

  it("writeToFile creates file with correct content", async () => {
    await writeToFile("test content 123", testPath);
    expect(existsSync(testPath)).toBe(true);
    expect(readFileSync(testPath, "utf8")).toBe("test content 123");
    unlinkSync(testPath);
  });
});
