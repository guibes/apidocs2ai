// Minimal type for the dereferenced spec — formatters receive this
export type DereferencedSpec = Record<string, unknown>;

export interface Formatter {
  readonly name: string;
  format(spec: DereferencedSpec): string;
}
