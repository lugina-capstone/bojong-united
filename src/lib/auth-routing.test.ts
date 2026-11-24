import { describe, expect, it } from "vitest";

import { destinationFor, destinationHref } from "@/lib/auth-routing";

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
