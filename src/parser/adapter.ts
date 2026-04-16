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

function extractVersion(spec: Record<string, unknown>): string {
  const swaggerVersion = spec.swagger as string | undefined;
  const openapiVersion = spec.openapi as string | undefined;
  return openapiVersion || swaggerVersion || "unknown";
}

async function upgradeIfNeeded(
  spec: Record<string, unknown>,
  warnings: string[]
): Promise<Record<string, unknown>> {
  const swaggerVersion = spec.swagger as string | undefined;
  if (!swaggerVersion?.startsWith("2.")) return spec;
  try {
    return upgrade(spec as Parameters<typeof upgrade>[0], "3.1") as Record<string, unknown>;
  } catch {
    warnings.push("Swagger 2.0 upgrade failed — using raw spec");
    return spec;
  }
}

function derefSpec(
  content: string,
  warnings: string[]
): Record<string, unknown> {
  try {
    const derefResult = dereference(content);
    return (derefResult.specification as Record<string, unknown>) || {};
  } catch {
    warnings.push("$ref dereferencing incomplete — some references may remain");
    // Parse manually as fallback
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

export async function parseSpec(
  content: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const warnings: string[] = [];

  // Attempt 1: full validate() pipeline
  try {
    const parseResult = await validate(content);

    if (!parseResult.valid && options.strict) {
      const errorMessages = (parseResult.errors || [])
        .map((e: { message?: string }) => e.message || String(e))
        .join(", ");
      throw new AppError(
        `Spec validation failed: ${errorMessages}`,
        ExitCode.PARSE_ERROR,
        "Fix the spec or omit --strict to proceed anyway",
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
    const version = extractVersion(rawSpec);
    const specToDeref = await upgradeIfNeeded(rawSpec, warnings);
    const dereferencedSpec = derefSpec(JSON.stringify(specToDeref), warnings);

    return { spec: dereferencedSpec, version, warnings };

  } catch (validateErr) {
    // Re-throw intentional AppErrors (strict mode rejections)
    if (validateErr instanceof AppError) throw validateErr;

    // validate() crashed internally (bug in @scalar error formatter on unusual specs)
    // Fall back to dereference-only — lenient mode should not crash here
    warnings.push(
      `Validation skipped (parser internal error: ${(validateErr as Error).message})`
    );

    if (options.strict) {
      throw new AppError(
        "Spec validation failed and --strict is set",
        ExitCode.PARSE_ERROR,
        "The spec has constructs that crash the validator. Remove --strict to proceed.",
        false
      );
    }

    // Attempt 2: dereference directly without validation
    try {
      const rawSpec = derefSpec(content, warnings);
      const version = extractVersion(rawSpec);
      const specToDeref = await upgradeIfNeeded(rawSpec, warnings);
      // Dereference the upgraded spec
      const finalSpec = derefSpec(JSON.stringify(specToDeref), warnings);
      return { spec: finalSpec, version, warnings };
    } catch (fallbackErr) {
      if (fallbackErr instanceof AppError) throw fallbackErr;
      throw new AppError(
        `Failed to parse spec: ${(fallbackErr as Error).message}`,
        ExitCode.PARSE_ERROR
      );
    }
  }
}
