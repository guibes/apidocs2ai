import type { DereferencedSpec } from "../../types/index.js";

function truncate(str: string, max = 80): string {
  return str && str.length > max ? str.slice(0, max - 3) + "..." : (str || "");
}

function schemaToTypeName(schema: Record<string, unknown>): string {
  if (!schema) return "unknown";
  if (schema.$ref) return String(schema.$ref).split("/").pop() || "unknown";
  if (schema.type === "array") {
    const items = schema.items as Record<string, unknown>;
    return `${schemaToTypeName(items)}[]`;
  }
  if (schema.type === "object") {
    if (schema.additionalProperties) {
      const valType = schemaToTypeName(schema.additionalProperties as Record<string, unknown>);
      return `{string:${valType}}`;
    }
    return "object";
  }
  const format = schema.format as string;
  if (schema.type === "string") {
    if (format === "binary" || format === "byte") return "file";
    if (format === "date-time") return "datetime";
    if (format === "date") return "date";
  }
  return (schema.type as string) || "unknown";
}

function getSuccessResponseType(responses: Record<string, unknown>): string {
  for (const code of ["200", "201", "202", "204"]) {
    const resp = responses[code] as Record<string, unknown>;
    if (!resp) continue;
    const content = resp.content as Record<string, unknown>;
    if (!content) return "";
    const jsonContent = content["application/json"] as Record<string, unknown>;
    if (!jsonContent) return "";
    const schema = jsonContent.schema as Record<string, unknown>;
    if (!schema) return "";
    return schemaToTypeName(schema);
  }
  return "";
}

function getParamType(schema: Record<string, unknown>): string {
  if (!schema) return "string";
  if (schema.enum) return (schema.enum as unknown[]).map((v) => `"${v}"`).join(" | ");
  if (schema.type === "array") {
    const items = schema.items as Record<string, unknown>;
    return `${getParamType(items)}[]`;
  }
  const format = schema.format as string;
  if (schema.type === "string") {
    if (format === "binary" || format === "byte") return "file";
  }
  return (schema.type as string) || "string";
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

function getDefaultLocation(method: string): string {
  if (method === "get" || method === "delete") return "query";
  return "body";
}

export function formatOps(spec: DereferencedSpec): string {
  const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;
  if (Object.keys(paths).length === 0) return "";

  const lines = ["[ops]"];

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method] as Record<string, unknown>;
      if (!op) continue;

      const operationId =
        (op.operationId as string) ||
        `${method}${path.replace(/[^a-zA-Z0-9]/g, "_")}`;

      lines.push(`\n${operationId} ${method.toUpperCase()} ${path}`);

      if (op.summary) lines.push(`  ${truncate(op.summary as string, 80)}`);

      const params = (op.parameters as Array<Record<string, unknown>>) || [];
      const defaultLoc = getDefaultLocation(method);

      for (const param of params) {
        const paramIn = param.in as string;
        if (paramIn === "path") continue;

        const paramName = param.name as string;
        const required = param.required === true;
        const schema = (param.schema || {}) as Record<string, unknown>;
        const type = getParamType(schema);
        const mark = required ? "" : "?";
        const annotation = paramIn !== defaultLoc ? ` @${paramIn}` : "";

        const defaultVal = (schema.default !== undefined) ? ` = ${schema.default}` : "";

        lines.push(`  > ${paramName}${mark}: ${type}${defaultVal}${annotation}`);
      }

      const requestBody = op.requestBody as Record<string, unknown>;
      if (requestBody) {
        const content = requestBody.content as Record<string, unknown>;
        const jsonContent = (
          content?.["application/json"] ||
          content?.["application/x-www-form-urlencoded"] ||
          content?.["multipart/form-data"]
        ) as Record<string, unknown>;
        const binaryContent = content?.["application/octet-stream"] as Record<string, unknown>;

        if (binaryContent) {
          const required = requestBody.required === true;
          const mark = required ? "" : "?";
          lines.push(`  > body${mark}: file`);
        } else if (jsonContent) {
          const schema = jsonContent?.schema as Record<string, unknown>;
          if (schema) {
            const required = requestBody.required === true;
            const type = schemaToTypeName(schema);
            const mark = required ? "" : "?";
            lines.push(`  > body${mark}: ${type}`);
          }
        }
      }

      const responses = (op.responses || {}) as Record<string, unknown>;
      const responseType = getSuccessResponseType(responses);
      if (responseType) lines.push(`  < ${responseType}`);
    }
  }

  return lines.join("\n");
}
