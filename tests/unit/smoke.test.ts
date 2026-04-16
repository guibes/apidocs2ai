import { describe, it, expect } from "bun:test";
import { existsSync } from "node:fs";

describe("project structure", () => {
  it("src directories exist", () => {
    expect(existsSync("src")).toBe(true);
    expect(existsSync("src/cli")).toBe(true);
    expect(existsSync("src/parser")).toBe(true);
    expect(existsSync("src/formatters")).toBe(true);
    expect(existsSync("src/output")).toBe(true);
    expect(existsSync("src/types")).toBe(true);
  });

  it("test directories exist", () => {
    expect(existsSync("tests/fixtures")).toBe(true);
    expect(existsSync("tests/unit")).toBe(true);
    expect(existsSync("tests/e2e")).toBe(true);
  });
});
