import { describe, it, expect } from "bun:test";
import { MarkdownFormatter } from "../../../src/formatters/markdown/index.js";

const testSpec = {
  openapi: "3.1.0",
  info: {
    title: "Pet Store API",
    version: "1.0.0",
    description: "A sample API for testing",
  },
  servers: [{ url: "https://api.example.com/v1" }],
  paths: {
    "/pets": {
      get: {
        operationId: "listPets",
        summary: "List all pets",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer" }, required: false, description: "Max items" },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive"] }, required: true },
        ],
        responses: {
          "200": {
            description: "Success",
            content: { "application/json": { schema: { type: "array", items: { type: "string" } } } },
          },
        },
      },
      post: {
        operationId: "createPet",
        summary: "Create a new pet",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, age: { type: "integer" } },
                required: ["name"],
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
  },
};

describe("MarkdownFormatter", () => {
  it("has correct name", () => {
    expect(new MarkdownFormatter().name).toBe("markdown");
  });

  it("output starts with # heading containing API title", () => {
    const output = new MarkdownFormatter().format(testSpec as any);
    expect(output.startsWith("# Pet Store API")).toBe(true);
  });

  it("contains endpoints table with Method column", () => {
    const output = new MarkdownFormatter().format(testSpec as any);
    expect(output).toContain("| Method |");
    expect(output).toContain("GET");
    expect(output).toContain("POST");
  });

  it("contains operation headings", () => {
    const output = new MarkdownFormatter().format(testSpec as any);
    expect(output).toContain("### listPets");
    expect(output).toContain("### createPet");
  });

  it("contains parameter list with bullets", () => {
    const output = new MarkdownFormatter().format(testSpec as any);
    expect(output).toContain("- `limit`");
    expect(output).toContain("- `status`");
  });

  it("output is valid markdown (no HTML tags)", () => {
    const output = new MarkdownFormatter().format(testSpec as any);
    expect(output).not.toMatch(/<[a-z]+>/);
  });

  it("output is smaller than JSON stringified input", () => {
    const inputSize = JSON.stringify(testSpec).length;
    const outputSize = new MarkdownFormatter().format(testSpec as any).length;
    expect(outputSize).toBeLessThan(inputSize);
  });
});
