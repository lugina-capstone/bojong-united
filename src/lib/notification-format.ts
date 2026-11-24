/** Teks dan tujuan notifikasi per tipe. Dipakai server (daftar) dan client (panel). */

export const notificationTypes = [
  "organization.submitted",
  "organization.resubmitted",
  "organization.approved",
  "organization.rejected",
  "organization.disabled",
  "organization.enabled",
  "member.joined",
  "member.left",
  "member.role-changed",
  "member.admin-granted",
  "member.admin-revoked",
  "trainer-request.submitted",
  "trainer-request.approved",
  "trainer-request.rejected",
  "event.transferred",
  "submission.new",
  "submission.revised",
  "revision.requested",
  "grade.published",
  "certificate.issued",
  "milestone.unlocked",
  "team.invited",
  "team.invite-accepted",
  "team.invite-rejected",
  "team.removed",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export type NotificationPayload = Record<string, string | undefined>;

export type NotificationIcon =
  | "building"
  | "refresh"
  | "check"
  | "x"
  | "user-plus"
  | "shield"
  | "book"
  | "power"
  | "calendar"
  | "file"
  | "award"
  | "users";

export type NotificationTone = "primary" | "success" | "warning" | "danger";

export type NotificationView = {
  title: string;
  body: string;
  href: string;
  icon: NotificationIcon;
  tone: NotificationTone;
};

export function describeNotification(
  type: string,
  payload: NotificationPayload,
): NotificationView {
  const org = payload.organizationName ?? "Organisasi";
  const name = payload.userName ?? "Anggota";
  switch (type as NotificationType) {
    case "organization.submitted":
      return {
        title: "Pengajuan organisasi baru",
        body: `${org} menunggu persetujuan.`,
        href: `/admin/persetujuan/${payload.organizationId}`,
        icon: "building",
        tone: "primary",
      };
    case "organization.resubmitted":
      return {
        title: "Pengajuan diajukan ulang",
        body: `${org} memperbaiki data pengajuan.`,
        href: `/admin/persetujuan/${payload.organizationId}`,
        icon: "refresh",
        tone: "primary",
      };
    case "organization.approved":
      return {
        title: "Organisasi disetujui",
        body: `${org} kini aktif. Bagikan kode organisasi.`,
        href: "/organisasi",
        icon: "check",
        tone: "success",
      };
    case "organization.rejected":
      return {
        title: "Pengajuan organisasi ditolak",
        body: payload.reason ?? `Pengajuan ${org} ditolak.`,
        href: "/masuk?status=ditolak",
        icon: "x",
        tone: "danger",
      };
    case "organization.disabled":
      return {
        title: "Organisasi dinonaktifkan",
        body: `${org} dinonaktifkan oleh Administrator.`,
        href: "/masuk?status=nonaktif",
        icon: "power",
        tone: "danger",
      };
    case "organization.enabled":
      return {
        title: "Organisasi diaktifkan kembali",
        body: `${org} sudah aktif kembali.`,
        href: "/ruang-kerja",
        icon: "check",
        tone: "success",
      };
    case "member.joined":
      return {
        title: "Anggota baru bergabung",
        body: `${name} bergabung memakai kode organisasi.`,
        href: "/organisasi/anggota",
        icon: "user-plus",
        tone: "success",
      };
    case "member.left":
      return {
        title: "Anggota keluar",
        body: `${name} keluar dari organisasi.`,
        href: "/organisasi/anggota",
        icon: "user-plus",
        tone: "warning",
      };
    case "member.role-changed":
      return {
        title: "Peran diperbarui",
        body: `Peran Anda di ${org} sekarang ${payload.role ?? "diperbarui"}.`,
        href: "/ruang-kerja",
        icon: "shield",
        tone: "primary",
      };
    case "member.admin-granted":
      return {
        title: "Anda menjadi admin",
        body: `Anda kini Admin Organisasi ${org}.`,
        href: "/organisasi",
        icon: "shield",
        tone: "primary",
      };
    case "member.admin-revoked":
      return {
        title: "Status admin dicabut",
        body: `Anda bukan lagi Admin Organisasi ${org}.`,
        href: "/ruang-kerja",
        icon: "shield",
        tone: "warning",
      };
    case "trainer-request.submitted":
      return {
        title: "Pengajuan akses Trainer baru",
        body: `${name} mengajukan akses Trainer untuk mengunggah materi.`,
        href: "/organisasi/anggota?tab=pengajuan",
        icon: "book",
        tone: "primary",
      };
    case "trainer-request.approved":
      return {
        title: "Pengajuan Trainer disetujui",
        body: "Anda kini Trainer dan dapat mengunggah materi.",
        href: "/ruang-kerja",
        icon: "check",
        tone: "success",
      };
    case "trainer-request.rejected":
      return {
        title: "Pengajuan Trainer ditolak",
        body: payload.reason ?? "Pengajuan Trainer Anda ditolak.",
        href: "/ruang-kerja",
        icon: "x",
        tone: "danger",
      };
    case "event.transferred":
      return {
        title: "Acara dialihkan ke Anda",
        body: `${payload.eventTitle ?? "Acara"} kini Anda kelola.`,
        href: "/organisasi/acara",
        icon: "calendar",
        tone: "primary",
      };
    case "submission.new":
      return {
        title: "Pengumpulan baru",
        body: `${name} mengumpulkan ${payload.milestoneTitle ?? "tugas"} · ${payload.eventTitle ?? ""}`,
        href: `/ruang-kerja/acara/${payload.eventId}/nilai/${payload.submissionId}`,
        icon: "file",
        tone: "primary",
      };
    case "submission.revised":
      return {
        title: "Revisi masuk",
        body: `${name} mengirim revisi ${payload.milestoneTitle ?? ""} · ${payload.eventTitle ?? ""}`,
        href: `/ruang-kerja/acara/${payload.eventId}/nilai/${payload.submissionId}`,
        icon: "refresh",
        tone: "primary",
      };
    case "revision.requested":
      return {
        title: "Revisi diminta",
        body: `${payload.milestoneTitle ?? "Tugas"} · ${payload.eventTitle ?? ""} perlu diperbaiki.`,
        href: `/acara/${payload.eventId}?m=${payload.milestoneOrder ?? 1}`,
        icon: "refresh",
        tone: "warning",
      };
    case "grade.published":
      return {
        title: "Nilai terbit",
        body: `${payload.milestoneTitle ?? "Milestone"} · ${payload.eventTitle ?? ""}: ${payload.score ?? ""}`,
        href: `/acara/${payload.eventId}?m=${payload.milestoneOrder ?? 1}`,
        icon: "check",
        tone: "success",
      };
    case "certificate.issued":
      return {
        title: "Sertifikat terbit",
        body: `Selamat! Sertifikat ${payload.eventTitle ?? "acara"} sudah tersedia.`,
        href: `/sertifikat/${payload.certificateNumber}`,
        icon: "award",
        tone: "success",
      };
    case "milestone.unlocked":
      return {
        title: "Milestone baru terbuka",
        body: `${payload.milestoneTitle ?? "Milestone berikutnya"} · ${payload.eventTitle ?? ""}`,
        href: `/acara/${payload.eventId}?m=${payload.milestoneOrder ?? 1}`,
        icon: "calendar",
        tone: "primary",
      };
    case "team.invited":
      return {
        title: "Undangan tim",
        body: `${name} mengundang Anda ke ${payload.teamName ?? "tim"} · ${payload.eventTitle ?? ""}`,
        href: `/beranda?undangan=${payload.inviteId}`,
        icon: "users",
        tone: "primary",
      };
    case "team.invite-accepted":
      return {
        title: "Undangan diterima",
        body: `${name} bergabung ke ${payload.teamName ?? "tim"}.`,
        href: `/jelajah/${payload.eventId}`,
        icon: "user-plus",
        tone: "success",
      };
    case "team.invite-rejected":
      return {
        title: "Undangan ditolak",
        body: `${name} menolak undangan ${payload.teamName ?? "tim"}.`,
        href: `/jelajah/${payload.eventId}`,
        icon: "x",
        tone: "warning",
      };
    case "team.removed":
      return {
        title: "Dikeluarkan dari tim",
        body: `Anda tidak lagi menjadi anggota ${payload.teamName ?? "tim"} · ${payload.eventTitle ?? ""}`,
        href: `/jelajah/${payload.eventId}`,
        icon: "x",
        tone: "danger",
      };
    default:
      return {
        title: "Notifikasi",
        body: "",
        href: "/",
        icon: "building",
        tone: "primary",
      };
  }
}
