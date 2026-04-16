import type { DereferencedSpec } from "../../types/index.js";

export function formatWebhooks(spec: DereferencedSpec): string {
  const webhooks = (spec.webhooks || spec["x-webhooks"]) as Record<string, unknown> | undefined;
  if (!webhooks || Object.keys(webhooks).length === 0) return "";

  const lines = ["[webhooks]"];
  for (const [name] of Object.entries(webhooks)) {
    lines.push(name);
  }
  return lines.join("\n");
}
