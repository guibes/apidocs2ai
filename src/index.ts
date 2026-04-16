export { loadAndParse, type ParseResult, type ParseOptions } from "./parser/index.js";
export { LapisFormatter } from "./formatters/lapis/index.js";
export { JsonFormatter } from "./formatters/json/index.js";
export { MarkdownFormatter } from "./formatters/markdown/index.js";
export type { Formatter, DereferencedSpec } from "./types/index.js";
export { OutputFormat, ExitCode, AppError } from "./types/index.js";

export async function parseSpec(input: string, options: { strict?: boolean } = {}) {
  const { loadAndParse } = await import("./parser/index.js");
  return loadAndParse(input, options);
}

export async function formatLapis(spec: Record<string, unknown>): Promise<string> {
  const { LapisFormatter } = await import("./formatters/lapis/index.js");
  return new LapisFormatter().format(spec);
}

export async function formatJson(spec: Record<string, unknown>, pretty = false): Promise<string> {
  const { JsonFormatter } = await import("./formatters/json/index.js");
  return new JsonFormatter({ pretty }).format(spec);
}

export async function formatMarkdown(spec: Record<string, unknown>): Promise<string> {
  const { MarkdownFormatter } = await import("./formatters/markdown/index.js");
  return new MarkdownFormatter().format(spec);
}
