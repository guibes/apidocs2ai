export enum OutputFormat {
  LAPIS = "lapis",
  JSON = "json",
  MARKDOWN = "markdown",
}

export enum InputSource {
  FILE = "file",
  URL = "url",
  STDIN = "stdin",
}

export interface CliOptions {
  format: OutputFormat;
  output?: string;
  copy: boolean;
  strict: boolean;
  json: boolean;
  pretty: boolean;
}
