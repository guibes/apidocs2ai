import { describe, it, expect } from "bun:test";
import { formatMeta } from "../../../src/formatters/lapis/meta.js";
import { formatTypes } from "../../../src/formatters/lapis/types.js";
import { LapisFormatter } from "../../../src/formatters/lapis/index.js";

const minimalSpec = {
  openapi: "3.1.0",
  info: { title: "Test API", version: "1.0.0", description: "A test API with a very long description that exceeds eighty characters easily" },
  servers: [{ url: "https://api.example.com/v1" }],
  paths: {},
  components: { schemas: {} },
};

describe("LAPIS meta section", () => {
  it("generates [meta] section with API name and version", () => {
    const output = formatMeta(minimalSpec as any);
    expect(output).toContain("[meta]");
    expect(output).toContain("Test API");
    expect(output).toContain("1.0.0");
  });

  it("truncates description to 80 chars", () => {
    const output = formatMeta(minimalSpec as any);
    const lines = output.split("\n");
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(120); // generous for key: value format
    }
    expect(output).not.toContain("easily");
  });

  it("includes base_url from first server", () => {
    const output = formatMeta(minimalSpec as any);
    expect(output).toContain("api.example.com");
  });
});

describe("LAPIS types section", () => {
  it("returns empty string when no schemas", () => {
    const output = formatTypes(minimalSpec as any);
    expect(output.trim()).toBe("");
  });

  it("generates [types] section with named schemas", () => {
    const specWithSchemas = {
      ...minimalSpec,
      components: {
        schemas: {
          Pet: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
            },
            required: ["name"],
          },
        },
      },
    };
    const output = formatTypes(specWithSchemas as any);
    expect(output).toContain("[types]");
    expect(output).toContain("Pet:");
    expect(output).toContain("name: string");
  });
});

describe("LapisFormatter", () => {
  it("has correct name", () => {
    expect(new LapisFormatter().name).toBe("lapis");
  });

  it("format() output starts with # LAPIS v0.1.0", () => {
    const formatter = new LapisFormatter();
    const output = formatter.format(minimalSpec as any);
    expect(output.startsWith("# LAPIS v0.1.0")).toBe(true);
  });
});
