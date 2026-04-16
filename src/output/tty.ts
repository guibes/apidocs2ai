export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

export function shouldUseColors(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  return isTTY();
}
