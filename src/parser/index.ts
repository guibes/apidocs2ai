import { detectSource, loadFromFile, loadFromUrl, loadFromStdin } from "./loader.js";
import { parseSpec, type ParseOptions, type ParseResult } from "./adapter.js";
import { InputSource } from "../types/index.js";

export { detectSource, loadFromFile, loadFromUrl, loadFromStdin } from "./loader.js";
export { parseSpec, type ParseOptions, type ParseResult } from "./adapter.js";

export async function loadAndParse(
  input: string | undefined,
  options: ParseOptions
): Promise<ParseResult> {
  let content: string;

  if (!input) {
    content = await loadFromStdin();
  } else {
    const source = detectSource(input);
    if (source === InputSource.URL) {
      content = await loadFromUrl(input);
    } else {
      content = await loadFromFile(input);
    }
  }

  return parseSpec(content, options);
}
