import type { Formatter, DereferencedSpec } from "../../types/index.js";

function truncate(str: string, max = 100): string {
  return str && str.length > max ? str.slice(0, max - 3) + "..." : (str || "");
}

function schemaToTypeName(schema: Record<string, unknown>): string {
  if (!schema) return "any";
  if (schema.$ref) return `\`${String(schema.$ref).split("/").pop()}\``;
  if (schema.enum) return (schema.enum as unknown[]).map(v => `"${v}"`).join(" | ");
  if (schema.type === "array") {
    const items = schema.items as Record<string, unknown>;
    return `${schemaToTypeName(items)}[]`;
  }
  return (schema.type as string) || "any";
}

function formatParameters(params: Array<Record<string, unknown>>): string {
  if (!params || params.length === 0) return "";
  const lines = ["\n**Parameters:**\n"];
  for (const param of params) {
    const name = param.name as string;
    const required = param.required === true;
    const schema = (param.schema || {}) as Record<string, unknown>;
    const type = schemaToTypeName(schema);
    const desc = param.description ? ` — ${truncate(param.description as string, 60)}` : "";
    const req = required ? " *(required)*" : "";
    lines.push(`- \`${name}\`: ${type}${req}${desc}`);
  }
  return lines.join("\n");
}

function formatRequestBody(requestBody: Record<string, unknown> | undefined): string {
  if (!requestBody) return "";
  const content = requestBody.content as Record<string, unknown>;
  const jsonContent = content?.["application/json"] as Record<string, unknown>;
  const schema = jsonContent?.schema as Record<string, unknown>;
  if (!schema) return "";

  const lines = ["\n**Request Body:**\n"];
  if (schema.type === "object" && schema.properties) {
    const props = schema.properties as Record<string, Record<string, unknown>>;
    const required = (schema.required as string[]) || [];
    for (const [propName, propSchema] of Object.entries(props)) {
      const type = schemaToTypeName(propSchema);
      const req = required.includes(propName) ? " *(required)*" : "";
      lines.push(`- \`${propName}\`: ${type}${req}`);
    }
  } else {
    lines.push(`- ${schemaToTypeName(schema)}`);
  }
  return lines.join("\n");
}

function getSuccessResponse(responses: Record<string, unknown>): string {
  for (const code of ["200", "201", "202"]) {
    const resp = responses[code] as Record<string, unknown>;
    if (!resp) continue;
    const content = resp.content as Record<string, unknown>;
    const jsonContent = content?.["application/json"] as Record<string, unknown>;
    const schema = jsonContent?.schema as Record<string, unknown>;
    if (schema) return `\`${schemaToTypeName(schema)}\``;
    if (resp.description) return truncate(resp.description as string, 60);
  }
  return "";
}

export class MarkdownFormatter implements Formatter {
  readonly name = "markdown";

  format(spec: DereferencedSpec): string {
    const info = (spec.info || {}) as Record<string, unknown>;
    const servers = (spec.servers as Array<{ url: string }>) || [];
    const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;
    const methods = ["get", "post", "put", "patch", "delete"];

    const sections: string[] = [];

    // Header
    sections.push(`# ${info.title || "API Documentation"}`);
    if (info.version) sections.push(`\nVersion: \`${info.version}\``);
    if (servers[0]?.url) sections.push(`\nBase URL: \`${servers[0].url}\``);
    if (info.description) sections.push(`\n${truncate(info.description as string, 200)}`);

    // Endpoints overview table
    const tableRows: string[] = [];
    tableRows.push("\n## Endpoints\n");
    tableRows.push("| Method | Path | Summary |");
    tableRows.push("|--------|------|---------|");

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const method of methods) {
        const op = pathItem[method] as Record<string, unknown>;
        if (!op) continue;
        const summary = truncate((op.summary as string) || "", 60);
        tableRows.push(`| ${method.toUpperCase()} | \`${path}\` | ${summary} |`);
      }
    }
    sections.push(tableRows.join("\n"));

    // Detailed operations
    sections.push("\n## Operations\n");

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const method of methods) {
        const op = pathItem[method] as Record<string, unknown>;
        if (!op) continue;

        const operationId = (op.operationId as string) || `${method}_${path.replace(/\//g, "_")}`;
        sections.push(`### ${operationId}`);
        sections.push(`\n\`${method.toUpperCase()} ${path}\``);
        if (op.summary) sections.push(`\n${truncate(op.summary as string, 100)}`);

        // Parameters
        const params = (op.parameters as Array<Record<string, unknown>>) || [];
        const paramStr = formatParameters(params);
        if (paramStr) sections.push(paramStr);

        // Request body
        const bodyStr = formatRequestBody(op.requestBody as Record<string, unknown>);
        if (bodyStr) sections.push(bodyStr);

        // Response
        const responses = (op.responses || {}) as Record<string, unknown>;
        const responseStr = getSuccessResponse(responses);
        if (responseStr) sections.push(`\n**Response:** ${responseStr}`);

        sections.push("");
      }
    }

    // Types/Schemas section
    const components = (spec.components || {}) as Record<string, unknown>;
    const schemas = (components.schemas || {}) as Record<string, Record<string, unknown>>;
    if (Object.keys(schemas).length > 0) {
      sections.push("## Types\n");
      for (const [name, schema] of Object.entries(schemas)) {
        sections.push(`### ${name}\n`);
        if (schema.type === "object" && schema.properties) {
          const props = schema.properties as Record<string, Record<string, unknown>>;
          const required = (schema.required as string[]) || [];
          for (const [propName, propSchema] of Object.entries(props)) {
            const type = schemaToTypeName(propSchema);
            const req = required.includes(propName) ? " *(required)*" : "";
            sections.push(`- \`${propName}\`: ${type}${req}`);
          }
        }
        sections.push("");
      }
    }

    return sections.join("\n");
  }
}
