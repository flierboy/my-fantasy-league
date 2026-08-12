export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

export function ok(message?: string): ActionResult {
  return { ok: true, message };
}
