import { describe, expect, it } from "vitest";

import { formatScore } from "@/lib/format";

describe("formatScore", () => {
  it("membulatkan nilai ke 2 desimal tanpa galat floating point", () => {
    expect(formatScore(55.00000000000001)).toBe("55");
    expect(formatScore(76.666666)).toBe("76.67");
    expect(formatScore(90)).toBe("90");
  });
});
