import type { DereferencedSpec } from "../../types/index.js";

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

export function formatMeta(spec: DereferencedSpec): string {
  const info = (spec.info || {}) as Record<string, unknown>;
  const servers = (spec.servers as Array<{ url: string }>) || [];
  const baseUrl = servers[0]?.url || "";

  const lines = ["[meta]"];

  if (info.title) lines.push(`api: ${info.title}`);
  if (info.version) lines.push(`version: ${info.version}`);
  if (baseUrl) lines.push(`base: ${baseUrl}`);
  if (info.description) lines.push(`desc: ${truncate(String(info.description), 74)}`);

  const securitySchemes =
    ((spec.components as Record<string, unknown>)?.securitySchemes as Record<
      string,
      { type?: string; flows?: Record<string, { authorizationUrl?: string; tokenUrl?: string }> }
    >) || {};

  for (const [, scheme] of Object.entries(securitySchemes)) {
    const authLine = buildAuthLine(scheme);
    if (authLine) {
      lines.push(`auth: ${authLine}`);
      break;
    }
  }

  return lines.join("\n");
}

function buildAuthLine(scheme: {
  type?: string;
  flows?: Record<string, { authorizationUrl?: string; tokenUrl?: string }>;
  name?: string;
  in?: string;
  scheme?: string;
}): string {
  const type = scheme.type?.toLowerCase();

  if (type === "http") {
    const httpScheme = (scheme as { scheme?: string }).scheme?.toLowerCase();
    if (httpScheme === "bearer") return "bearer header:Authorization";
    if (httpScheme === "basic") return "basic";
  }

  if (type === "apikey") {
    const location = (scheme as { in?: string }).in;
    const name = (scheme as { name?: string }).name;
    if (location === "header") return `apikey header:${name || "X-API-Key"}`;
    if (location === "query") return `apikey query:${name || "api_key"}`;
  }

  if (type === "oauth2") {
    const flows = scheme.flows || {};
    const tokenUrl =
      flows.implicit?.authorizationUrl ||
      flows.authorizationCode?.authorizationUrl ||
      flows.clientCredentials?.tokenUrl ||
      flows.password?.tokenUrl ||
      "";
    return tokenUrl ? `oauth2 ${tokenUrl}` : "oauth2";
  }

  return "";
}
