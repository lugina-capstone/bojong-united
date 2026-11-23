/** Format error seragam untuk semua Route Handler: `{ error: { code, message } }`. */
export function apiError(
  status: number,
  code: string,
  message: string,
  init?: ResponseInit,
) {
  return Response.json({ error: { code, message } }, { ...init, status });
}
