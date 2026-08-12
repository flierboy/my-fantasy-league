/** Shared form field parsers (not a server-actions module). */

export function parseIntField(
  value: FormDataEntryValue | null,
  field: string,
  opts?: { min?: number; max?: number; allowEmpty?: boolean }
): { value: number | null; error?: string } {
  if (value == null || String(value).trim() === "") {
    if (opts?.allowEmpty) return { value: null };
    return { value: null, error: `${field} is required` };
  }
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { value: null, error: `${field} must be a whole number` };
  }
  if (opts?.min != null && n < opts.min) {
    return { value: null, error: `${field} must be ≥ ${opts.min}` };
  }
  if (opts?.max != null && n > opts.max) {
    return { value: null, error: `${field} must be ≤ ${opts.max}` };
  }
  return { value: n };
}

export function parseNumberField(
  value: FormDataEntryValue | null,
  field: string,
  opts?: { min?: number }
): { value: number | null; error?: string } {
  if (value == null || String(value).trim() === "") {
    return { value: null, error: `${field} is required` };
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return { value: null, error: `${field} must be a number` };
  }
  if (opts?.min != null && n < opts.min) {
    return { value: null, error: `${field} must be ≥ ${opts.min}` };
  }
  return { value: n };
}
