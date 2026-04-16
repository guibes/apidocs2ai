import { loadAndParse } from "../parser/index.js";
import { getFormatter } from "./commands.js";
import { writeOutput, writeError, writeWarning, writeProgress } from "../output/writer.js";
import { writeToFile, writeToClipboard } from "../output/destinations.js";
import { AppError, ExitCode, OutputFormat } from "../types/index.js";

export interface PipelineOptions {
  format: string;
  output?: string;
  copy?: boolean;
  strict?: boolean;
  json?: boolean;
  pretty?: boolean;
}

export async function runPipeline(input: string | undefined, options: PipelineOptions): Promise<void> {
  const format = (options.format as OutputFormat) || OutputFormat.LAPIS;

  if (!Object.values(OutputFormat).includes(format)) {
    writeError("BAD_ARGS", `Unknown format: ${options.format}`, `Use one of: ${Object.values(OutputFormat).join(", ")}`);
    process.exit(ExitCode.BAD_ARGS);
  }

  writeProgress(`Parsing spec...`);

  let parseResult;
  try {
    parseResult = await loadAndParse(input, { strict: options.strict ?? false });
  } catch (err) {
    if (err instanceof AppError) {
      writeError(ExitCode[err.code] || "GENERAL", err.message, err.hint, err.retryable);
      process.exit(err.code);
    }
    writeError("GENERAL", (err as Error).message);
    process.exit(ExitCode.GENERAL);
  }

  for (const warning of parseResult.warnings) {
    writeWarning(warning);
  }

  writeProgress(`Formatting as ${format}...`);
  const formatter = getFormatter(format, { pretty: options.pretty });
  const formatted = formatter.format(parseResult.spec);

  if (options.json) {
    const envelope = JSON.stringify({ ok: true, format, data: formatted }, null, options.pretty ? 2 : 0);
    writeOutput(envelope);
  } else if (options.output) {
    try {
      await writeToFile(formatted, options.output);
      writeProgress(`Written to ${options.output}`);
    } catch (err) {
      writeError("GENERAL", `Failed to write to file: ${(err as Error).message}`);
      process.exit(ExitCode.GENERAL);
    }
  } else if (options.copy) {
    try {
      await writeToClipboard(formatted);
      writeProgress(`Copied to clipboard`);
    } catch (err) {
      writeError("GENERAL", `Clipboard unavailable: ${(err as Error).message}`, "Install xclip or xsel on Linux");
      process.exit(ExitCode.GENERAL);
    }
  } else {
    writeOutput(formatted);
  }
}
