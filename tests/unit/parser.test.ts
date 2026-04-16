import { describe, it, expect } from "bun:test";
import { detectSource, loadFromFile } from "../../src/parser/loader.js";
import { InputSource } from "../../src/types/index.js";
import { loadAndParse } from "../../src/parser/index.js";

describe("detectSource", () => {
  it("detects URL", () => {
    expect(detectSource("https://example.com/spec.yaml")).toBe(InputSource.URL);
    expect(detectSource("http://example.com/spec.json")).toBe(InputSource.URL);
  });

  it("detects file path", () => {
    expect(detectSource("./spec.yaml")).toBe(InputSource.FILE);
    expect(detectSource("/absolute/path/spec.json")).toBe(InputSource.FILE);
    expect(detectSource("spec.yaml")).toBe(InputSource.FILE);
  });
});

describe("loadFromFile", () => {
  it("loads YAML file", async () => {
    const content = await loadFromFile("tests/fixtures/minimal.yaml");
    expect(typeof content).toBe("string");
    expect(content).toContain("openapi");
  });

  it("loads JSON file", async () => {
    const content = await loadFromFile("tests/fixtures/petstore-2.0.json");
    expect(typeof content).toBe("string");
    expect(content).toContain("swagger");
  });

  it("throws AppError for missing file", async () => {
    try {
      await loadFromFile("nonexistent.yaml");
      throw new Error("Should have thrown");
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toContain("not found");
      }
    }
  });
});

describe("loadAndParse", () => {
  it("parses minimal OAS 3.0 YAML file", async () => {
    const result = await loadAndParse("tests/fixtures/minimal.yaml", {});
    expect(result).toBeDefined();
    expect(result.spec).toBeDefined();
    expect(typeof result.version).toBe("string");
  });

  it("handles circular ref without hanging (timeout 5s)", async () => {
    const result = await loadAndParse("tests/fixtures/circular-ref.yaml", {});
    expect(result).toBeDefined();
  }, 5000);

  it("parses petstore-2.0.json (Swagger 2.0)", async () => {
    const result = await loadAndParse("tests/fixtures/petstore-2.0.json", {});
    expect(result).toBeDefined();
    expect(result.spec).toBeDefined();
  });
});
