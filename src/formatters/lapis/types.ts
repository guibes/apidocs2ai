import type { DereferencedSpec } from "../../types/index.js";

function getTypeString(schema: Record<string, unknown>): string {
  if (!schema) return "unknown";

  if (schema.enum) {
    return (schema.enum as unknown[]).map((v) => `"${v}"`).join(" | ");
  }

  const type = schema.type as string;
  const format = schema.format as string;

  if (type === "array") {
    const items = schema.items as Record<string, unknown>;
    const itemType = items ? getTypeString(items) : "unknown";
    return `[${itemType}]`;
  }

  if (type === "integer") return format === "int64" ? "int64" : "int32";
  if (type === "number") return "float";
  if (type === "boolean") return "boolean";
  if (type === "string") return format === "binary" ? "binary" : "string";
  if (type === "object") return "object";

  if (schema.$ref) return String(schema.$ref).split("/").pop() || "unknown";

  return type || "unknown";
}

function schemaToLapis(schema: Record<string, unknown>, indent = "  "): string {
  if (!schema || typeof schema !== "object") return "";

  const lines: string[] = [];
  const properties =
    (schema.properties as Record<string, Record<string, unknown>>) || {};
  const required = (schema.required as string[]) || [];

  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(propName);
    const type = getTypeString(propSchema);
    const mark = isRequired ? "" : "?";
    lines.push(`${indent}${propName}${mark}: ${type}`);
  }

  return lines.join("\n");
}

export function formatTypes(spec: DereferencedSpec): string {
  const components = (spec.components || {}) as Record<string, unknown>;
  const schemas = (components.schemas || {}) as Record<
    string,
    Record<string, unknown>
  >;

  if (Object.keys(schemas).length === 0) return "";

  const lines = ["[types]"];

  for (const [name, schema] of Object.entries(schemas)) {
    lines.push(`${name}:`);
    const body = schemaToLapis(schema);
    if (body) lines.push(body);
  }

  return lines.join("\n");
}
