import { describe, expect, it } from "vitest";

import { maskEmail } from "@/lib/event-rules";
import { canManageRubric } from "@/lib/rubric-access";
import { submissionSchema } from "@/lib/validations/event";
import { isWebUrl } from "@/lib/web-url";

describe("isWebUrl", () => {
  it("hanya menerima http dan https", () => {
    expect(isWebUrl("https://contoh.id/karya")).toBe(true);
    expect(isWebUrl("http://contoh.id")).toBe(true);
    expect(isWebUrl("javascript:alert(1)")).toBe(false);
    expect(isWebUrl("data:text/html,<p>x</p>")).toBe(false);
    expect(isWebUrl("bukan tautan")).toBe(false);
  });

  it("dipakai skema pengumpulan", () => {
    expect(
      submissionSchema.safeParse({ link: "https://contoh.id" }).success,
    ).toBe(true);
    expect(
      submissionSchema.safeParse({ link: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(submissionSchema.parse({ link: "" }).link).toBeNull();
  });
});

describe("maskEmail", () => {
  it("menyisakan dua huruf awal dan domain", () => {
    expect(maskEmail("dimas@gmail.com")).toBe("di***@gmail.com");
    expect(maskEmail("ab@x.id")).toBe("a***@x.id");
    expect(maskEmail("a@x.id")).toBe("a***@x.id");
    expect(maskEmail("rusak")).toBe("***");
  });
});

describe("canManageRubric", () => {
  const rubric = { creatorId: "guru-a" };
  it("mengizinkan pembuat dan Admin Organisasi saja", () => {
    expect(
      canManageRubric(rubric, { id: "guru-a", membership: { isAdmin: false } }),
    ).toBe(true);
    expect(
      canManageRubric(rubric, { id: "admin", membership: { isAdmin: true } }),
    ).toBe(true);
    expect(
      canManageRubric(rubric, { id: "guru-b", membership: { isAdmin: false } }),
    ).toBe(false);
  });
});
