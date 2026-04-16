#!/usr/bin/env node
import { createProgram } from "./cli/commands.js";
import { runPipeline } from "./cli/pipeline.js";
import { writeError } from "./output/writer.js";
import { AppError, ExitCode } from "./types/index.js";

const program = createProgram();

program.action(async (input: string | undefined, options: {
  format: string;
  output?: string;
  copy?: boolean;
  strict?: boolean;
  json?: boolean;
  pretty?: boolean;
}) => {
  try {
    await runPipeline(input, options);
  } catch (err) {
    if (err instanceof AppError) {
      writeError(ExitCode[err.code] || "GENERAL", err.message, err.hint, err.retryable);
      process.exit(err.code);
    }
    writeError("GENERAL", (err as Error).message || "Unknown error");
    process.exit(ExitCode.GENERAL);
  }
});

program.parse();
