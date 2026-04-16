import { writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

export function writeToStdout(data: string): void {
  process.stdout.write(data);
  if (!data.endsWith("\n")) {
    process.stdout.write("\n");
  }
}

export async function writeToFile(data: string, filePath: string): Promise<void> {
  await writeFile(filePath, data, "utf8");
}

export async function writeToClipboard(data: string): Promise<void> {
  const platform = process.platform;
  let cmd: string;
  let args: string[];

  if (platform === "darwin") {
    cmd = "pbcopy";
    args = [];
  } else if (platform === "win32") {
    cmd = "clip";
    args = [];
  } else {
    // Linux: try xclip, fallback to xsel
    cmd = "xclip";
    args = ["-selection", "clipboard"];
  }

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "ignore", "ignore"] });
    child.stdin.write(data);
    child.stdin.end();
    child.on("exit", (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`Clipboard command '${cmd}' failed with exit code ${code}`));
    });
    child.on("error", (err: Error) => {
      reject(new Error(`Clipboard command '${cmd}' not available: ${err.message}`));
    });
  });
}
