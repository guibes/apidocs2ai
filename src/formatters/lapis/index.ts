import type { Formatter, DereferencedSpec } from "../../types/index.js";
import { formatMeta } from "./meta.js";
import { formatTypes } from "./types.js";
import { formatOps } from "./ops.js";
import { formatWebhooks } from "./webhooks.js";
import { formatErrors } from "./errors.js";

export class LapisFormatter implements Formatter {
  readonly name = "lapis";

  format(spec: DereferencedSpec): string {
    const sections: string[] = ["# LAPIS v0.1.0"];

    const meta = formatMeta(spec);
    if (meta) sections.push("", meta);

    const types = formatTypes(spec);
    if (types) sections.push("", types);

    const ops = formatOps(spec);
    if (ops) sections.push("", ops);

    const webhooks = formatWebhooks(spec);
    if (webhooks) sections.push("", webhooks);

    const errors = formatErrors(spec);
    if (errors) sections.push("", errors);

    return sections.join("\n").trimEnd() + "\n";
  }
}

export { formatMeta } from "./meta.js";
export { formatTypes } from "./types.js";
export { formatOps } from "./ops.js";
export { formatWebhooks } from "./webhooks.js";
export { formatErrors } from "./errors.js";
