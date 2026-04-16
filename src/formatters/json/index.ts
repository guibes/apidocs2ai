import type { Formatter, DereferencedSpec } from "../../types/index.js";

export interface JsonFormatterOptions {
  pretty?: boolean;
}

const INFO_NOISE = ["contact", "license", "termsOfService", "x-logo"];
const TOP_LEVEL_NOISE = ["externalDocs", "tags"];
const SCHEMA_NOISE = ["example", "examples", "xml", "discriminator", "externalDocs"];
const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

function stripObject(obj: unknown, depth = 0): unknown {
  if (depth > 20 || obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(item => stripObject(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key.startsWith("x-")) continue;
    if (SCHEMA_NOISE.includes(key)) continue;
    result[key] = stripObject(value, depth + 1);
  }
  return result;
}

function stripResponseHeaders(paths: Record<string, Record<string, unknown>>) {
  for (const pathItem of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method] as Record<string, Record<string, unknown>> | undefined;
      if (!op?.responses) continue;
      for (const response of Object.values(op.responses)) {
        if (response && typeof response === "object") {
          delete (response as Record<string, unknown>).headers;
        }
      }
    }
  }
}

export class JsonFormatter implements Formatter {
  readonly name = "json";
  private pretty: boolean;

  constructor(options: JsonFormatterOptions = {}) {
    this.pretty = options.pretty ?? false;
  }

  format(spec: DereferencedSpec): string {
    let cleaned = JSON.parse(JSON.stringify(spec)) as Record<string, unknown>;

    for (const key of TOP_LEVEL_NOISE) {
      delete cleaned[key];
    }

    if (cleaned.info && typeof cleaned.info === "object") {
      const info = cleaned.info as Record<string, unknown>;
      for (const key of INFO_NOISE) {
        delete info[key];
      }
    }

    if (Array.isArray(cleaned.servers) && cleaned.servers.length > 1) {
      cleaned.servers = [cleaned.servers[0]];
    }

    cleaned = stripObject(cleaned) as Record<string, unknown>;

    const paths = cleaned.paths as Record<string, Record<string, unknown>> | undefined;
    if (paths) {
      stripResponseHeaders(paths);
    }

    return this.pretty
      ? JSON.stringify(cleaned, null, 2)
      : JSON.stringify(cleaned);
  }
}
