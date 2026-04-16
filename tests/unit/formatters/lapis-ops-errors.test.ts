import { describe, it, expect } from "bun:test";
import { formatOps } from "../../../src/formatters/lapis/ops.js";
import { formatErrors } from "../../../src/formatters/lapis/errors.js";
import { LapisFormatter } from "../../../src/formatters/lapis/index.js";
import { readFileSync } from "node:fs";

const minimalSpec = {
  openapi: "3.1.0",
  info: { title: "Test API", version: "1.0.0" },
  paths: {
    "/pets": {
      get: {
        operationId: "listPets",
        summary: "List all pets",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer" }, required: false }],
        responses: {
          "200": { description: "Success", content: { "application/json": { schema: { type: "array", items: { type: "string" } } } } },
          "400": { description: "Bad request" },
        },
      },
      post: {
        operationId: "createPet",
        summary: "Create a pet",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NewPet" } } } },
        responses: { "201": { description: "Created" }, "400": { description: "Bad request" } },
      },
    },
  },
  components: {
    schemas: {
      NewPet: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
    },
  },
};

describe("LAPIS ops section", () => {
  it("generates [ops] section", () => {
    const output = formatOps(minimalSpec as any);
    expect(output).toContain("[ops]");
    expect(output).toContain("listPets GET /pets");
    expect(output).toContain("createPet POST /pets");
  });

  it("uses > prefix for params", () => {
    const output = formatOps(minimalSpec as any);
    expect(output).toContain("> limit?:");
  });

  it("uses < for success response", () => {
    const output = formatOps(minimalSpec as any);
    expect(output).toContain("< string[]");
  });
});

describe("LAPIS errors section", () => {
  it("centralizes errors (deduplicated)", () => {
    const output = formatErrors(minimalSpec as any);
    expect(output).toContain("[errors]");
    // 400 appears in both ops but should only appear once in [errors]
    const count400 = (output.match(/400:/g) || []).length;
    expect(count400).toBe(1);
  });
});

describe("LapisFormatter full output", () => {
  it("full format has all required sections", () => {
    const formatter = new LapisFormatter();
    const output = formatter.format(minimalSpec as any);
    expect(output).toContain("# LAPIS v0.1.0");
    expect(output).toContain("[meta]");
    expect(output).toContain("[ops]");
    expect(output).toContain("[errors]");
  });

  it("achieves significant char reduction on petstore", async () => {
    const { loadAndParse } = await import("../../../src/parser/index.js");
    const parsed = await loadAndParse("tests/fixtures/petstore-3.0.yaml", {});
    const formatter = new LapisFormatter();
    const lapisOutput = formatter.format(parsed.spec);

    const inputBytes = readFileSync("tests/fixtures/petstore-3.0.yaml").length;
    const outputBytes = Buffer.byteLength(lapisOutput, "utf8");
    const reductionPct = ((1 - outputBytes / inputBytes) * 100).toFixed(1);
    console.log(`Token reduction: ${reductionPct}%`);
    expect(outputBytes).toBeLessThan(inputBytes * 0.5); // at least 50% reduction
  });
});
