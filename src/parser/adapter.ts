import { validate, dereference } from "@scalar/openapi-parser";
import { upgrade } from "@scalar/openapi-upgrader";
import { AppError, ExitCode } from "../types/index.js";

export interface ParseResult {
  spec: Record<string, unknown>;
  version: string;
  warnings: string[];
}

export interface ParseOptions {
  strict?: boolean;
}

export async function parseSpec(
  content: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const parseResult = await validate(content);

    if (!parseResult.valid && options.strict) {
      const errorMessages = (parseResult.errors || [])
        .map((e: { message?: string }) => e.message || String(e))
        .join(", ");
      throw new AppError(
        `Spec validation failed: ${errorMessages}`,
        ExitCode.PARSE_ERROR,
        "Use --strict=false or fix the spec",
        false
      );
    }

    if (!parseResult.valid) {
      for (const error of parseResult.errors || []) {
        warnings.push(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error)
        );
      }
    }

    const rawSpec = (parseResult.schema as Record<string, unknown>) || {};
    const swaggerVersion = rawSpec.swagger as string | undefined;
    const openapiVersion = rawSpec.openapi as string | undefined;
    const version = openapiVersion || swaggerVersion || "unknown";

    let specToDeref: Record<string, unknown> = rawSpec;

    if (swaggerVersion?.startsWith("2.")) {
      try {
        const upgraded = upgrade(rawSpec as Parameters<typeof upgrade>[0], "3.1") as Record<string, unknown>;
        specToDeref = upgraded;
      } catch {
        warnings.push("Swagger 2.0 upgrade failed — using raw spec");
      }
    }

    let dereferencedSpec: Record<string, unknown>;
    try {
      const derefResult = dereference(JSON.stringify(specToDeref));
      dereferencedSpec =
        (derefResult.specification as Record<string, unknown>) || specToDeref;
    } catch {
      dereferencedSpec = specToDeref;
      warnings.push("$ref dereferencing incomplete — some references may remain");
    }

    return {
      spec: dereferencedSpec,
      version,
      warnings,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      `Failed to parse spec: ${(err as Error).message}`,
      ExitCode.PARSE_ERROR
    );
  }
}
