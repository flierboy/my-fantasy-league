export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  /** Optional structured extras (e.g. avatar public URL after upload) */
  data?: Record<string, string>;
};

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

export function ok(
  message?: string,
  data?: Record<string, string>
): ActionResult {
  return { ok: true, message, data };
}
