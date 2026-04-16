export enum ExitCode {
  SUCCESS = 0,
  GENERAL = 1,
  BAD_ARGS = 2,
  NOT_FOUND = 3,
  PARSE_ERROR = 4,
  NETWORK_ERROR = 5,
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ExitCode = ExitCode.GENERAL,
    public readonly hint?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
  }
}
