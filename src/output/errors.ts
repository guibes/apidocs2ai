export function formatErrorEnvelope(
  errorType: string,
  message: string,
  hint?: string,
  retryable: boolean = false
): string {
  return JSON.stringify({
    error: true,
    error_type: errorType,
    message,
    ...(hint !== undefined && { hint }),
    retryable,
  });
}
