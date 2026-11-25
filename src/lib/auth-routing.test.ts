import { describe, expect, it } from "vitest";

import {
  afterSignInHref,
  destinationFor,
  destinationHref,
  safeCallbackPath,
} from "@/lib/auth-routing";

const member = (
  status: "ACTIVE" | "REMOVED",
  organization: "PENDING" | "APPROVED" | "REJECTED" | "DISABLED",
) => ({
  isAdministrator: false,
  membership: { status, organization: { status: organization } },
});

describe("destinationFor", () => {
  it("mengarahkan Administrator ke beranda Administrator", () => {
    expect(
      destinationHref(
        destinationFor({ isAdministrator: true, membership: null }),
      ),
    ).toBe("/admin");
  });

  it("mengarahkan Peserta ke Beranda Peserta", () => {
    expect(
      destinationHref(
        destinationFor({ isAdministrator: false, membership: null }),
      ),
    ).toBe("/beranda");
  });

  it("mengarahkan anggota organisasi disetujui ke Ruang Kerja", () => {
    expect(destinationHref(destinationFor(member("ACTIVE", "APPROVED")))).toBe(
      "/ruang-kerja",
    );
  });

  it("menampilkan layar status untuk organisasi menunggu, ditolak, dan nonaktif", () => {
    expect(destinationHref(destinationFor(member("ACTIVE", "PENDING")))).toBe(
      "/masuk?status=menunggu",
    );
    expect(destinationHref(destinationFor(member("ACTIVE", "REJECTED")))).toBe(
      "/masuk?status=ditolak",
    );
    expect(destinationHref(destinationFor(member("ACTIVE", "DISABLED")))).toBe(
      "/masuk?status=nonaktif",
    );
  });

  it("mengarahkan anggota yang dikeluarkan ke layar Dikeluarkan", () => {
    expect(destinationHref(destinationFor(member("REMOVED", "APPROVED")))).toBe(
      "/dikeluarkan",
    );
  });
});

describe("safeCallbackPath", () => {
  it("menerima path di dalam aplikasi beserta query", () => {
    expect(safeCallbackPath("/acara/abc?tab=tim")).toBe("/acara/abc?tab=tim");
  });

  it.each([
    "https://evil.test/x",
    "//evil.test/x",
    "/\\evil.test/x",
    "/a/..//evil.test/x",
    "/a/../\\evil.test/x",
    "acara",
    "/masuk?status=menunggu",
    "/daftar/google",
    "/api/auth/get-session",
    "",
    undefined,
    ["/acara"],
  ])("menolak %j", (value) => {
    expect(safeCallbackPath(value)).toBeUndefined();
  });
});

describe("afterSignInHref", () => {
  it("memakai alamat semula untuk akun yang masuk ke beranda", () => {
    expect(
      afterSignInHref({ type: "home", href: "/beranda" }, "/acara/abc"),
    ).toBe("/acara/abc");
  });

  it("mengabaikan alamat semula untuk akun dikeluarkan atau berstatus", () => {
    expect(
      afterSignInHref({ type: "removed", href: "/dikeluarkan" }, "/acara/abc"),
    ).toBe("/dikeluarkan");
    expect(
      afterSignInHref({ type: "status", status: "menunggu" }, "/acara/abc"),
    ).toBe("/masuk?status=menunggu");
  });

  it("kembali ke beranda bila alamat semula tidak aman", () => {
    expect(
      afterSignInHref({ type: "home", href: "/admin" }, "//evil.test"),
    ).toBe("/admin");
  });
});
