import { describe, it, expect } from "bun:test";
import { getFormatter, detectInputSource } from "../../src/cli/commands.js";
import { OutputFormat } from "../../src/types/index.js";

describe("getFormatter", () => {
  it("returns LapisFormatter for lapis format", () => {
    const f = getFormatter(OutputFormat.LAPIS);
    expect(f.name).toBe("lapis");
  });

  it("returns JsonFormatter for json format", () => {
    const f = getFormatter(OutputFormat.JSON);
    expect(f.name).toBe("json");
  });

  it("returns MarkdownFormatter for markdown format", () => {
    const f = getFormatter(OutputFormat.MARKDOWN);
    expect(f.name).toBe("markdown");
  });
});

describe("detectInputSource", () => {
  it("detects URL source", () => {
    expect(detectInputSource("https://example.com/spec.yaml")).toBe("url");
    expect(detectInputSource("http://example.com/spec.json")).toBe("url");
  });

  it("detects file source", () => {
    expect(detectInputSource("./spec.yaml")).toBe("file");
    expect(detectInputSource("/abs/path/spec.json")).toBe("file");
    expect(detectInputSource("spec.yaml")).toBe("file");
  });

  it("detects stdin when no input", () => {
    expect(detectInputSource(undefined)).toBe("stdin");
  });
});
