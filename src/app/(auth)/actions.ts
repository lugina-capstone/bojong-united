"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { limitAuthAction } from "@/lib/auth-rate-limit";
import {
  afterSignInHref,
  destinationFor,
  destinationHref,
} from "@/lib/auth-routing";
import { db } from "@/lib/db";
import {
  notifyAdministrators,
  notifyOrganizationAdmins,
} from "@/lib/notifications";
import { generateOrganizationCode } from "@/lib/organization-code";
import { OTP_RESEND_SECONDS, OTP_VALID_MINUTES, otpResendKey } from "@/lib/otp";
import { type CurrentUser, requireUser } from "@/lib/session";
import {
  forgotPasswordSchema,
  joinOrganizationSchema,
  logoContentTypes,
  MAX_LOGO_SIZE,
  organizationCodeSchema,
  organizationDataSchema,
  otpSchema,
  registerOrganizationSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/auth";
import { profileSchema } from "@/lib/validations/profile";

export type FormState = {
  ok?: boolean;
  error?: string;
  /** Kode error untuk layar khusus, mis. EMAIL_TAKEN, EMAIL_NOT_VERIFIED, ACCOUNT_LOCKED. */
  code?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
};

function fieldErrorsOf(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { fieldErrors };
}

/**
 * Email dianggap terpakai bila akunnya sudah terverifikasi atau kode OTP-nya masih berlaku.
 * Akun yang tidak pernah diverifikasi dihapus (beserta pengajuan organisasinya) agar pemilik
 * email tidak terkunci oleh pendaftaran orang lain dan tidak mewarisi organisasi pilihan orang itu.
 */
async function emailTaken(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      emailVerified: true,
      createdAt: true,
      membership: {
        select: {
          isAdmin: true,
          organization: {
            select: {
              id: true,
              status: true,
              _count: { select: { members: true } },
            },
          },
        },
      },
    },
  });
  if (!user) return false;
  const otpExpired =
    user.createdAt.getTime() < Date.now() - OTP_VALID_MINUTES * 60 * 1000;
  if (user.emailVerified || !otpExpired) return true;
  // Kode yang dikirim ulang memperpanjang masa tunggu.
  const activeCode = await db.verification.count({
    where: {
      identifier: { endsWith: `-otp-${email}` },
      expiresAt: { gt: new Date() },
    },
  });
  if (activeCode > 0) return true;
  const organization = user.membership?.organization;
  const ownPendingOrganization =
    user.membership?.isAdmin &&
    organization?.status === "PENDING" &&
    organization._count.members === 1;
  await db.$transaction([
    db.user.deleteMany({ where: { id: user.id, emailVerified: false } }),
    ...(ownPendingOrganization && organization
      ? [
          db.organization.deleteMany({
            where: {
              id: organization.id,
              status: "PENDING",
              members: { none: {} },
            },
          }),
        ]
      : []),
  ]);
  return (await db.user.count({ where: { email } })) > 0;
}

const EMAIL_TAKEN: FormState = {
  code: "EMAIL_TAKEN",
  fieldErrors: { email: "Email ini sudah terdaftar." },
};

/** Buat akun; mengembalikan id user, atau FormState error jika Better Auth menolak. */
async function signUpUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<string | FormState> {
  try {
    const result = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
      headers: await headers(),
    });
    return result.user.id;
  } catch (error) {
    if (!isAPIError(error)) throw error;
    // Dua pendaftaran bersamaan dengan email yang sama: yang kalah mendapat pesan yang sama.
    if (await emailTaken(input.email)) return EMAIL_TAKEN;
    return { error: error.message };
  }
}

/** Akun yang baru dibuat dihapus lagi bila langkah lanjutannya gagal, agar email bisa dipakai ulang. */
async function rollbackSignUp(
  userId: string,
  error: unknown,
): Promise<FormState> {
  console.error("Pendaftaran dibatalkan", error);
  await db.user.delete({ where: { id: userId } });
  return { error: "Pendaftaran gagal diproses. Coba lagi." };
}

/** Daftar Peserta (AA-01). Berhasil → layar OTP di sisi client. */
export async function signUpAction(input: unknown): Promise<FormState> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const limited = await limitAuthAction("signUp");
  if (limited) return { error: limited };
  if (await emailTaken(parsed.data.email)) return EMAIL_TAKEN;
  const created = await signUpUser(parsed.data);
  if (typeof created !== "string") return created;
  return { ok: true, email: parsed.data.email };
}

/** Cek kode organisasi untuk form Gabung (AA-08). */
export async function checkOrganizationCodeAction(code: string) {
  const parsed = organizationCodeSchema.safeParse(code);
  if (!parsed.success) return { valid: false as const };
  if (await limitAuthAction("organizationCode"))
    return { valid: false as const };
  const organization = await db.organization.findUnique({
    where: { code: parsed.data },
    select: { name: true, type: true, status: true },
  });
  if (!organization || organization.status !== "APPROVED")
    return { valid: false as const };
  return {
    valid: true as const,
    name: organization.name,
    type: organization.type,
  };
}

/** Daftar akun baru sekaligus gabung organisasi sebagai Guru. */
export async function registerMemberAction(input: unknown): Promise<FormState> {
  const parsed = joinOrganizationSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const limited = await limitAuthAction("signUp");
  if (limited) return { error: limited };
  const organization = await db.organization.findUnique({
    where: { code: parsed.data.code },
    select: { id: true, status: true },
  });
  if (!organization || organization.status !== "APPROVED")
    return {
      fieldErrors: { code: "Kode tidak valid atau organisasi tidak aktif." },
    };
  if (await emailTaken(parsed.data.email)) return EMAIL_TAKEN;
  const userId = await signUpUser(parsed.data);
  if (typeof userId !== "string") return userId;
  try {
    await db.membership.create({
      data: { userId, organizationId: organization.id, role: "GURU" },
    });
  } catch (error) {
    return rollbackSignUp(userId, error);
  }
  return { ok: true, email: parsed.data.email };
}

async function createOrganization(
  userId: string,
  data: z.infer<typeof organizationDataSchema>,
  contactEmail: string,
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.organization.create({
        data: {
          name: data.organizationName,
          type: data.organizationType,
          contactEmail,
          code: generateOrganizationCode(),
          members: { create: { userId, role: "TRAINER", isAdmin: true } },
        },
        select: { id: true },
      });
    } catch (error) {
      const codeClash =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 3;
      if (!codeClash) throw error;
    }
  }
}

/**
 * Daftar organisasi baru (AA-06): akun pemohon + organisasi PENDING, pemohon jadi admin.
 * Pengajuan dari akun yang emailnya belum terverifikasi tidak ditampilkan di antrean Administrator.
 */
export async function registerOrganizationAction(
  input: unknown,
): Promise<FormState> {
  const parsed = registerOrganizationSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const limited = await limitAuthAction("signUp");
  if (limited) return { error: limited };
  if (await emailTaken(parsed.data.email)) return EMAIL_TAKEN;
  const userId = await signUpUser(parsed.data);
  if (typeof userId !== "string") return userId;
  try {
    await createOrganization(userId, parsed.data, parsed.data.email);
  } catch (error) {
    return rollbackSignUp(userId, error);
  }
  return { ok: true, email: parsed.data.email };
}

/**
 * Hanya akun yang baru keluar/dikeluarkan dari organisasi yang boleh pindah organisasi.
 * Akun Peserta harus dihapus dulu, lalu mendaftar ulang sebagai organisasi.
 */
function organizationChoiceBlocked(user: CurrentUser) {
  if (user.membership?.status === "ACTIVE")
    return "Akun ini masih tergabung di organisasi.";
  if (user.membership?.status !== "REMOVED")
    return "Akun Peserta tidak bisa bergabung ke organisasi. Hapus akun ini, lalu daftar ulang sebagai organisasi.";
  return null;
}

/** Akun yang baru keluar/dikeluarkan membuat organisasi baru. */
export async function createOrganizationAction(
  input: unknown,
): Promise<FormState> {
  const user = await requireUser();
  const blocked = organizationChoiceBlocked(user);
  if (blocked) return { error: blocked };
  const parsed = organizationDataSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  await db.membership.deleteMany({ where: { userId: user.id } });
  const organization = await createOrganization(
    user.id,
    parsed.data,
    user.email,
  );
  await notifyAdministrators("organization.submitted", {
    organizationId: organization.id,
    organizationName: parsed.data.organizationName,
    userName: user.name,
  });
  return { ok: true };
}

/** Akun yang baru keluar/dikeluarkan bergabung dengan kode. */
export async function joinOrganizationAction(code: string): Promise<FormState> {
  const user = await requireUser();
  const blocked = organizationChoiceBlocked(user);
  if (blocked) return { error: blocked };
  const parsed = organizationCodeSchema.safeParse(code);
  const organization = parsed.success
    ? await db.organization.findUnique({
        where: { code: parsed.data },
        select: { id: true, status: true },
      })
    : null;
  if (!organization || organization.status !== "APPROVED")
    return {
      fieldErrors: { code: "Kode tidak valid atau organisasi tidak aktif." },
    };
  await db.membership.deleteMany({ where: { userId: user.id } });
  await db.membership.create({
    data: { userId: user.id, organizationId: organization.id, role: "GURU" },
  });
  await notifyOrganizationAdmins(
    organization.id,
    "member.joined",
    { organizationId: organization.id, userName: user.name },
    user.id,
  );
  redirect("/ruang-kerja");
}

/** Ajukan ulang organisasi yang ditolak dengan data yang sudah diperbaiki. */
export async function resubmitOrganizationAction(
  input: unknown,
): Promise<FormState> {
  const user = await requireUser();
  const membership = await db.membership.findUnique({
    where: { userId: user.id },
    select: {
      isAdmin: true,
      organization: { select: { id: true, status: true } },
    },
  });
  if (!membership?.isAdmin || membership.organization.status !== "REJECTED")
    return { error: "Tidak ada pengajuan ditolak yang bisa diajukan ulang." };
  const parsed = organizationDataSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  await db.organization.update({
    where: { id: membership.organization.id },
    data: {
      name: parsed.data.organizationName,
      type: parsed.data.organizationType,
      status: "PENDING",
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null,
    },
  });
  await notifyAdministrators("organization.resubmitted", {
    organizationId: membership.organization.id,
    organizationName: parsed.data.organizationName,
    userName: user.name,
  });
  return { ok: true };
}

/** Pasang logo (file sudah diupload lewat /api/files) ke organisasi yang dikelola user. */
export async function setOrganizationLogoAction(fileId: string) {
  const user = await requireUser();
  const membership = await db.membership.findUnique({
    where: { userId: user.id },
    select: { isAdmin: true, organizationId: true },
  });
  const file = await db.file.findFirst({
    where: { id: fileId, ownerId: user.id, status: "UPLOADED" },
    select: { size: true, contentType: true },
  });
  const validLogo =
    file &&
    file.size <= MAX_LOGO_SIZE &&
    (logoContentTypes as readonly string[]).includes(file.contentType);
  if (!membership?.isAdmin || !validLogo) return { ok: false };
  await db.organization.update({
    where: { id: membership.organizationId },
    data: { logoFileId: fileId },
  });
  return { ok: true };
}

/** Verifikasi OTP (AA-02). Berhasil → sesi dibuat otomatis. */
export async function verifyOtpAction(input: unknown): Promise<FormState> {
  const parsed = otpSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const limited = await limitAuthAction("verifyOtp");
  if (limited) return { code: "RATE_LIMITED", error: limited };
  try {
    await auth.api.verifyEmailOTP({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error))
      return {
        code: "INVALID_OTP",
        error:
          "Kode salah atau sudah kedaluwarsa. Periksa lagi atau kirim ulang kode.",
      };
    throw error;
  }
  await notifyAfterVerification(parsed.data.email);
  return { ok: true };
}

/** Pengajuan/anggota baru baru diberitahukan setelah email pemohon terverifikasi. */
async function notifyAfterVerification(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      membership: {
        select: {
          isAdmin: true,
          status: true,
          organization: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });
  const membership = user?.membership;
  if (!user || membership?.status !== "ACTIVE") return;
  const { organization } = membership;
  const payload = {
    organizationId: organization.id,
    organizationName: organization.name,
    userName: user.name,
  };
  if (membership.isAdmin && organization.status === "PENDING")
    await notifyAdministrators("organization.submitted", payload);
  else if (!membership.isAdmin && organization.status === "APPROVED")
    await notifyOrganizationAdmins(
      organization.id,
      "member.joined",
      payload,
      user.id,
    );
}

/** True jika token reset dengan kriteria ini dibuat kurang dari `OTP_RESEND_SECONDS` lalu. */
async function sentRecently(where: Prisma.VerificationWhereInput) {
  const since = new Date(Date.now() - (OTP_RESEND_SECONDS - 5) * 1000);
  return (
    (await db.verification.count({
      where: { ...where, createdAt: { gt: since } },
    })) > 0
  );
}

const WAIT_RESEND = "Tunggu sebentar sebelum meminta kode baru.";

export async function resendOtpAction(email: string): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const limited = await limitAuthAction("resendOtp");
  if (limited) return { error: limited };
  // Penanda dibuat setiap kode dikirim (lihat `sendVerificationOTP` di auth.ts).
  const waiting = await db.verification.count({
    where: {
      identifier: otpResendKey(parsed.data.email),
      expiresAt: { gt: new Date(Date.now() + 5000) },
    },
  });
  if (waiting > 0) return { error: WAIT_RESEND };
  try {
    await auth.api.sendVerificationOTP({
      body: { email: parsed.data.email, type: "email-verification" },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) return { error: WAIT_RESEND };
    throw error;
  }
  return { ok: true };
}

/** Tujuan setelah sesi ada: beranda, layar Dikeluarkan, atau layar status di Masuk. */
export async function homeHref(callbackURL?: unknown) {
  const user = await requireUser();
  return afterSignInHref(destinationFor(user), callbackURL);
}

/** Masuk (AA-04). */
export async function signInAction(
  input: unknown,
  callbackURL?: string,
): Promise<FormState> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const { email } = parsed.data;
  const limited = await limitAuthAction("signIn");
  if (limited) return { code: "RATE_LIMITED", email, error: limited };
  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (!isAPIError(error)) throw error;
    const code = String(error.body?.code ?? "");
    if (code === "EMAIL_NOT_VERIFIED") return { code, email };
    if (code === "ACCOUNT_LOCKED") return { code, email, error: error.message };
    return {
      code: "INVALID_CREDENTIALS",
      email,
      error: "Email atau kata sandi salah.",
    };
  }
  const user = await db.user.findUnique({
    where: { email },
    select: {
      isAdministrator: true,
      membership: {
        select: { status: true, organization: { select: { status: true } } },
      },
    },
  });
  if (!user) redirect("/masuk");
  const destination = destinationFor(user);
  if (destination.type === "status" && destination.status !== "ditolak") {
    await auth.api.signOut({ headers: await headers() });
    redirect(
      `/masuk?status=${destination.status}&email=${encodeURIComponent(email)}`,
    );
  }
  redirect(afterSignInHref(destination, callbackURL));
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/masuk");
}

/** Dari "Lengkapi Data Google": keluar lalu daftar lewat formulir email. */
export async function signOutToSignUpAction() {
  const user = await requireUser();
  await auth.api.signOut({ headers: await headers() });
  // Akun Google yang belum melengkapi data dihapus agar emailnya bisa dipakai di formulir email.
  await db.user.deleteMany({
    where: {
      id: user.id,
      profileCompletedAt: null,
      isAdministrator: false,
      membership: null,
      accounts: { none: { providerId: "credential" } },
      enrollments: { none: {} },
      materialEnrollments: { none: {} },
      trainerRequests: { none: {} },
    },
  });
  redirect("/daftar");
}

export async function forgotPasswordAction(input: unknown): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const limited = await limitAuthAction("forgotPassword");
  if (limited) return { error: limited };
  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, emailVerified: true },
  });
  // Akun yang belum terverifikasi tidak bisa dipulihkan lewat reset; pemilik email mendaftar ulang.
  if (user && !user.emailVerified)
    return { ok: true, email: parsed.data.email };
  const throttled =
    user &&
    (await sentRecently({
      value: user.id,
      identifier: { startsWith: "reset-password:" },
    }));
  if (throttled) return { ok: true, email: parsed.data.email };
  await auth.api.requestPasswordReset({
    body: { email: parsed.data.email, redirectTo: "/reset-password" },
    headers: await headers(),
  });
  return { ok: true, email: parsed.data.email };
}

export async function resetPasswordAction(
  token: string,
  input: unknown,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const limited = await limitAuthAction("resetPassword");
  if (limited) return { error: limited };
  try {
    await auth.api.resetPassword({
      body: { token, newPassword: parsed.data.password },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) return { code: "INVALID_TOKEN" };
    throw error;
  }
  return { ok: true };
}

/** Lengkapi Data Google (AA-03): akun Google baru mengisi nama lalu masuk sebagai Peserta. */
export async function completeGoogleProfileAction(
  input: unknown,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  await db.user.update({
    where: { id: user.id },
    data: { ...parsed.data, profileCompletedAt: new Date() },
  });
  redirect(destinationHref(destinationFor(user)));
}

/** Akun dikeluarkan memilih lanjut sebagai Peserta. */
export async function continueAsPesertaAction() {
  const user = await requireUser();
  await db.membership.deleteMany({
    where: { userId: user.id, status: "REMOVED" },
  });
  redirect("/beranda");
}

/**
 * Hapus akun (AA-10). Data pribadi dan sertifikat dihapus; acara, kiriman, dan penilaian tetap tersimpan.
 * Email dianonimkan agar bisa dipakai mendaftar lagi.
 */
export async function deleteAccountAction(input: {
  email: string;
  confirmed: boolean;
}): Promise<FormState> {
  const user = await requireUser();
  // Hanya Peserta (tanpa organisasi) atau akun yang sudah keluar/dikeluarkan.
  if (
    user.isAdministrator ||
    (user.membership && user.membership.status !== "REMOVED")
  )
    return {
      error: "Hapus akun hanya tersedia setelah keluar dari organisasi.",
    };
  if (input.email.trim().toLowerCase() !== user.email || !input.confirmed)
    return { fieldErrors: { email: "Email tidak cocok dengan akun ini." } };
  await db.$transaction(async (tx) => {
    // Acara yang belum mulai: lepaskan slot tim dan alihkan ketua agar tim tidak terkunci.
    const notStarted = {
      OR: [{ startsAt: null }, { startsAt: { gt: new Date() } }],
    };
    const upcoming = await tx.enrollment.findMany({
      where: { userId: user.id, event: notStarted },
      select: { id: true, team: { select: { id: true, leaderId: true } } },
    });
    await tx.enrollment.deleteMany({
      where: { id: { in: upcoming.map((e) => e.id) } },
    });
    for (const { team } of upcoming) {
      if (team?.leaderId !== user.id) continue;
      const next = await tx.enrollment.findFirst({
        where: { teamId: team.id },
        orderBy: { createdAt: "asc" },
        select: { userId: true },
      });
      if (next)
        await tx.team.update({
          where: { id: team.id },
          data: { leaderId: next.userId },
        });
      else await tx.team.delete({ where: { id: team.id } });
    }
    // Sertifikat memuat nama asli penerima, jadi ikut dihapus.
    await tx.certificate.deleteMany({
      where: { enrollment: { userId: user.id } },
    });
    await tx.materialEnrollment.deleteMany({ where: { userId: user.id } });
    await tx.notification.deleteMany({ where: { userId: user.id } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.account.deleteMany({ where: { userId: user.id } });
    await tx.membership.deleteMany({ where: { userId: user.id } });
    await tx.teamInvite.updateMany({
      where: {
        status: "PENDING",
        OR: [{ inviteeId: user.id }, { inviterId: user.id }],
      },
      data: { status: "CANCELLED", respondedAt: new Date() },
    });
    await tx.user.update({
      where: { id: user.id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        email: `deleted+${user.id.toLowerCase()}@becraft.invalid`,
        name: "Akun dihapus",
        image: null,
        phone: null,
      },
    });
  });
  redirect("/akun-dihapus");
}
