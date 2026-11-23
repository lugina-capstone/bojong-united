import { describe, expect, it } from "vitest";

import {
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  isApiScope,
  parseBearerToken,
} from "@/lib/api/api-key";

describe("API key", () => {
  it("membuat key unik dengan prefix dan hash yang cocok", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key).not.toBe(b.key);
    expect(a.key.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(a.key.startsWith(a.prefix)).toBe(true);
    expect(a.hash).toBe(hashApiKey(a.key));
    expect(a.hash).not.toContain(a.key);
  });

  it("membaca Bearer token yang valid saja", () => {
    const { key } = generateApiKey();
    expect(parseBearerToken(`Bearer ${key}`)).toBe(key);
    expect(parseBearerToken(`bearer ${key}`)).toBe(key);
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken(key)).toBeNull();
    expect(parseBearerToken("Bearer bukan-key")).toBeNull();
  });

  it("hanya mengenali scope yang terdaftar", () => {
    expect(isApiScope("health:read")).toBe(true);
    expect(isApiScope("user:manage")).toBe(false);
  });
});
