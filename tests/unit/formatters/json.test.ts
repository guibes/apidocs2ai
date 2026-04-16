import { describe, it, expect } from "bun:test";
import { JsonFormatter } from "../../../src/formatters/json/index.js";

const testSpec = {
  openapi: "3.1.0",
  info: {
    title: "Test API",
    version: "1.0.0",
    contact: { email: "test@example.com" },
    license: { name: "MIT" },
    termsOfService: "https://example.com/terms",
  },
  externalDocs: { url: "https://example.com/docs" },
  servers: [
    { url: "https://api.example.com" },
    { url: "https://staging.example.com" },
  ],
  "x-custom": "should be removed",
  paths: {
    "/pets": {
      get: {
        operationId: "listPets",
        summary: "List pets",
        "x-internal": true,
        parameters: [{
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            example: 10,
            examples: { foo: "bar" },
            xml: { name: "limit" },
          },
        }],
        responses: {
          "200": {
            description: "Success",
            headers: { "X-Rate-Limit": { schema: { type: "integer" } } },
            content: { "application/json": { schema: { type: "array" } } },
          },
        },
      },
    },
  },
};

describe("JsonFormatter", () => {
  it("has correct name", () => {
    expect(new JsonFormatter().name).toBe("json");
  });

  it("strips info.contact, info.license, info.termsOfService", () => {
    const output = new JsonFormatter().format(testSpec as any);
    const parsed = JSON.parse(output);
    expect(parsed.info.contact).toBeUndefined();
    expect(parsed.info.license).toBeUndefined();
    expect(parsed.info.termsOfService).toBeUndefined();
    expect(parsed.info.title).toBe("Test API"); // kept
  });

  it("strips externalDocs and x-* extensions", () => {
    const output = new JsonFormatter().format(testSpec as any);
    const parsed = JSON.parse(output);
    expect(parsed.externalDocs).toBeUndefined();
    expect(parsed["x-custom"]).toBeUndefined();
    expect(parsed.paths["/pets"].get["x-internal"]).toBeUndefined();
  });

  it("keeps only first server", () => {
    const output = new JsonFormatter().format(testSpec as any);
    const parsed = JSON.parse(output);
    expect(parsed.servers).toHaveLength(1);
    expect(parsed.servers[0].url).toBe("https://api.example.com");
  });

  it("strips examples, xml from schemas", () => {
    const output = new JsonFormatter().format(testSpec as any);
    const parsed = JSON.parse(output);
    const schema = parsed.paths["/pets"].get.parameters[0].schema;
    expect(schema.example).toBeUndefined();
    expect(schema.examples).toBeUndefined();
    expect(schema.xml).toBeUndefined();
    expect(schema.type).toBe("integer"); // kept
  });

  it("strips response headers", () => {
    const output = new JsonFormatter().format(testSpec as any);
    const parsed = JSON.parse(output);
    expect(parsed.paths["/pets"].get.responses["200"].headers).toBeUndefined();
  });

  it("output is valid JSON", () => {
    const output = new JsonFormatter().format(testSpec as any);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("output is minified (no newlines)", () => {
    const output = new JsonFormatter({ pretty: false }).format(testSpec as any);
    expect(output.includes("\n")).toBe(false);
  });

  it("output is smaller than input", () => {
    const inputSize = JSON.stringify(testSpec).length;
    const outputSize = new JsonFormatter().format(testSpec as any).length;
    expect(outputSize).toBeLessThan(inputSize);
  });
});
