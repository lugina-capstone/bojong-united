import { describe, expect, it } from "vitest";

import {
  canDeleteEvent,
  canInviteToTeam,
  canRemoveTeamMember,
  eventPhase,
  finalScore,
  milestoneScore,
  shouldIssueCertificate,
  unlockedMilestoneIndex,
} from "@/lib/event-rules";

const now = new Date("2026-05-10T00:00:00Z");
const day = 24 * 60 * 60 * 1000;

describe("event rules", () => {
  it("menentukan fase acara dari status dan tanggal", () => {
    const base = {
      startsAt: new Date(now.getTime() - day),
      endsAt: new Date(now.getTime() + day),
    };
    expect(eventPhase({ ...base, status: "DRAFT" }, now)).toBe("draft");
    expect(eventPhase({ ...base, status: "PUBLISHED" }, now)).toBe("ongoing");
    expect(eventPhase({ ...base, status: "CLOSED" }, now)).toBe("finished");
    expect(
      eventPhase(
        {
          status: "PUBLISHED",
          startsAt: new Date(now.getTime() + day),
          endsAt: null,
        },
        now,
      ),
    ).toBe("upcoming");
  });

  it("menghitung nilai milestone tanpa bobot", () => {
    expect(milestoneScore([4, 4, 4, 4])).toEqual({
      total: 16,
      max: 20,
      score: 80,
    });
    expect(milestoneScore([5, 3])).toEqual({ total: 8, max: 10, score: 80 });
  });

  it("nilai akhir rata-rata, kosong jika ada milestone belum dinilai", () => {
    expect(finalScore([80, 90, 70])).toBe(80);
    expect(finalScore([80, null])).toBeNull();
    expect(finalScore([])).toBeNull();
  });

  it("sertifikat terbit hanya jika nilai akhir ≥ KKM", () => {
    expect(
      shouldIssueCertificate({
        certificateEnabled: true,
        kkm: 75,
        milestoneScores: [80, 76],
      }),
    ).toBe(true);
    expect(
      shouldIssueCertificate({
        certificateEnabled: true,
        kkm: 75,
        milestoneScores: [70, 76],
      }),
    ).toBe(false);
    expect(
      shouldIssueCertificate({
        certificateEnabled: false,
        kkm: 75,
        milestoneScores: [90],
      }),
    ).toBe(false);
  });

  it("milestone berikutnya terbuka setelah tugas dan survei", () => {
    const m = (submitted: boolean, surveyDone: boolean) => ({
      submitted,
      surveyDone,
      hasSurvey: true,
    });
    expect(
      unlockedMilestoneIndex([m(false, false), m(false, false)], false),
    ).toBe(-1);
    expect(
      unlockedMilestoneIndex([m(false, false), m(false, false)], true),
    ).toBe(0);
    expect(
      unlockedMilestoneIndex([m(true, false), m(false, false)], true),
    ).toBe(0);
    expect(unlockedMilestoneIndex([m(true, true), m(false, false)], true)).toBe(
      1,
    );
    expect(unlockedMilestoneIndex([m(true, true), m(true, true)], true)).toBe(
      1,
    );
  });

  it("aturan tim: slot, tim lain, dan keluarkan sebelum mulai", () => {
    expect(
      canInviteToTeam({
        maxMembers: 4,
        joined: 2,
        pending: 1,
        inviteeHasTeam: false,
      }).allowed,
    ).toBe(true);
    expect(
      canInviteToTeam({
        maxMembers: 4,
        joined: 3,
        pending: 1,
        inviteeHasTeam: false,
      }).allowed,
    ).toBe(false);
    expect(
      canInviteToTeam({
        maxMembers: 4,
        joined: 1,
        pending: 0,
        inviteeHasTeam: true,
      }).allowed,
    ).toBe(false);
    expect(canRemoveTeamMember(false, false).allowed).toBe(true);
    expect(canRemoveTeamMember(true, false).allowed).toBe(false);
    expect(canRemoveTeamMember(false, true).allowed).toBe(false);
  });

  it("acara dengan peserta tidak bisa dihapus", () => {
    expect(canDeleteEvent("DRAFT", 3).allowed).toBe(true);
    expect(canDeleteEvent("PUBLISHED", 0).allowed).toBe(true);
    expect(canDeleteEvent("PUBLISHED", 1).allowed).toBe(false);
  });
});
