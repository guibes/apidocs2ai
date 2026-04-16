import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { AppError, ExitCode, InputSource } from "../types/index.js";

export function detectSource(input: string): InputSource {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return InputSource.URL;
  }
  return InputSource.FILE;
}

export async function loadFromFile(filePath: string): Promise<string> {
  if (!existsSync(filePath)) {
    throw new AppError(`File not found: ${filePath}`, ExitCode.NOT_FOUND);
  }
  return readFile(filePath, "utf8");
}

export async function loadFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(
        `HTTP ${response.status}: ${response.statusText}`,
        ExitCode.NETWORK_ERROR,
        `Check if URL is accessible: ${url}`
      );
    }
    return response.text();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      `Network error fetching ${url}: ${(err as Error).message}`,
      ExitCode.NETWORK_ERROR,
      undefined,
      true
    );
  }
}

export function loadFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      reject(
        new AppError(
          "No input provided. Specify a file path or URL, or pipe input.",
          ExitCode.BAD_ARGS
        )
      );
      return;
    }

    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      reject(
        new AppError(
          "Stdin timeout: no data received within 500ms",
          ExitCode.BAD_ARGS
        )
      );
    }, 500);

    process.stdin.on("data", (chunk: Buffer) => {
      clearTimeout(timeout);
      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    process.stdin.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(new AppError(`Stdin error: ${err.message}`, ExitCode.GENERAL));
    });
  });
}
