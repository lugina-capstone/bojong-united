import { createHash, randomBytes } from "node:crypto";

export const API_KEY_PREFIX = "bu_";

/** Scope izin API key. Tambahkan scope baru bersama endpoint yang membutuhkannya. */
export const apiScopes = ["health:read"] as const;

export type ApiScope = (typeof apiScopes)[number];

export function isApiScope(value: string): value is ApiScope {
  return (apiScopes as readonly string[]).includes(value);
}

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

/** API key baru. `key` hanya ditampilkan sekali; yang disimpan hanya `prefix` dan `hash`. */
export function generateApiKey() {
  const key = API_KEY_PREFIX + randomBytes(32).toString("base64url");
  return {
    key,
    prefix: key.slice(0, API_KEY_PREFIX.length + 8),
    hash: hashApiKey(key),
  };
}

/** API key dari header `Authorization: Bearer <key>`, atau null. */
export function parseBearerToken(header: string | null) {
  const token = header?.match(/^Bearer\s+(\S+)$/i)?.[1];
  return token?.startsWith(API_KEY_PREFIX) ? token : null;
}
