import type { DereferencedSpec } from "../../types/index.js";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

export function formatErrors(spec: DereferencedSpec): string {
  const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;
  const errorMap = new Map<string, string>();

  for (const pathItem of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method] as Record<string, unknown>;
      if (!op) continue;
      const responses = (op.responses || {}) as Record<string, unknown>;
      for (const [code, resp] of Object.entries(responses)) {
        const statusCode = parseInt(code, 10);
        if (isNaN(statusCode) || statusCode < 400 || statusCode >= 600) continue;
        if (!errorMap.has(code)) {
          const description = (resp as Record<string, unknown>).description as string || "Error";
          errorMap.set(code, description);
        }
      }
    }
  }

  if (errorMap.size === 0) return "";

  const lines = ["[errors]"];
  for (const [code, description] of Array.from(errorMap.entries()).sort()) {
    lines.push(`${code}: ${description}`);
  }
  return lines.join("\n");
}
