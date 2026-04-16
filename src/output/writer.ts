import { formatErrorEnvelope } from "./errors.js";
import { isTTY } from "./tty.js";

export function writeOutput(data: string): void {
  process.stdout.write(data);
  if (!data.endsWith("\n")) {
    process.stdout.write("\n");
  }
}

export function writeError(errorType: string, message: string, hint?: string, retryable?: boolean): void {
  process.stderr.write(formatErrorEnvelope(errorType, message, hint, retryable) + "\n");
}

export function writeWarning(message: string): void {
  process.stderr.write(`WARNING: ${message}\n`);
}

export function writeProgress(message: string): void {
  if (isTTY()) {
    process.stderr.write(`${message}\n`);
  }
}
