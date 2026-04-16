import { AppError, ExitCode } from "../types/index.js";

export function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      reject(new AppError(
        "No input provided. Specify a file path or URL, or pipe input via stdin.",
        ExitCode.BAD_ARGS,
        "Usage: apidocs2ai <file-or-url>\n       cat spec.yaml | apidocs2ai"
      ));
      return;
    }

    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      reject(new AppError("Stdin timeout: no data received within 500ms", ExitCode.BAD_ARGS));
    }, 500);

    process.stdin.on("data", (chunk: Buffer) => {
      clearTimeout(timeout);
      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
      clearTimeout(timeout);
      const data = Buffer.concat(chunks).toString("utf8").trim();
      if (!data) {
        reject(new AppError("Empty input received from stdin", ExitCode.BAD_ARGS));
        return;
      }
      resolve(data);
    });

    process.stdin.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(new AppError(`Stdin error: ${err.message}`, ExitCode.GENERAL));
    });
  });
}
