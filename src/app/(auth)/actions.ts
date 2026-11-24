"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { destinationFor, destinationHref } from "@/lib/auth-routing";
import { db } from "@/lib/db";
import { generateOrganizationCode } from "@/lib/organization-code";
import { getCurrentUser } from "@/lib/session";
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

async function emailTaken(email: string) {
  return (await db.user.count({ where: { email } })) > 0;
}

const EMAIL_TAKEN: FormState = {
  code: "EMAIL_TAKEN",
  fieldErrors: { email: "Email ini sudah terdaftar." },
};

async function signUpUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const result = await auth.api.signUpEmail({
    body: { name: input.name, email: input.email, password: input.password },
    headers: await headers(),
  });
  return result.user.id;
}

/** Daftar Peserta (AA-01). Berhasil → layar OTP di sisi client. */
export async function signUpAction(input: unknown): Promise<FormState> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (await emailTaken(parsed.data.email)) return EMAIL_TAKEN;
  try {
    await signUpUser(parsed.data);
  } catch (error) {
    if (isAPIError(error)) return { error: error.message };
    throw error;
  }
  return { ok: true, email: parsed.data.email };
}

/** Cek kode organisasi untuk form Gabung (AA-08). */
export async function checkOrganizationCodeAction(code: string) {
  const parsed = organizationCodeSchema.safeParse(code);
  if (!parsed.success) return { valid: false as const };
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
  await db.membership.create({
    data: { userId, organizationId: organization.id, role: "GURU" },
  });
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

/** Daftar organisasi baru (AA-06): akun pemohon + organisasi PENDING, pemohon jadi admin. */
export async function registerOrganizationAction(
  input: unknown,
): Promise<FormState> {
  const parsed = registerOrganizationSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (await emailTaken(parsed.data.email)) return EMAIL_TAKEN;
  const userId = await signUpUser(parsed.data);
  await createOrganization(userId, parsed.data, parsed.data.email);
  return { ok: true, email: parsed.data.email };
}

/** Akun yang sedang masuk (dikeluarkan atau Peserta) membuat organisasi baru. */
export async function createOrganizationAction(
  input: unknown,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  const parsed = organizationDataSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (user.membership?.status === "ACTIVE")
    return { error: "Akun ini masih tergabung di organisasi." };
  await db.membership.deleteMany({ where: { userId: user.id } });
  await createOrganization(user.id, parsed.data, user.email);
  return { ok: true };
}

/** Akun yang sedang masuk (dikeluarkan atau Peserta) bergabung dengan kode. */
export async function joinOrganizationAction(code: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  if (user.membership?.status === "ACTIVE")
    return { error: "Akun ini masih tergabung di organisasi." };
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
  redirect("/ruang-kerja");
}

/** Ajukan ulang organisasi yang ditolak dengan data yang sudah diperbaiki. */
export async function resubmitOrganizationAction(
  input: unknown,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
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
  return { ok: true };
}

/** Pasang logo (file sudah diupload lewat /api/files) ke organisasi yang dikelola user. */
export async function setOrganizationLogoAction(fileId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
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
  return { ok: true };
}

export async function resendOtpAction(email: string): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  try {
    await auth.api.sendVerificationOTP({
      body: { email: parsed.data.email, type: "email-verification" },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error))
      return { error: "Tunggu sebentar sebelum meminta kode baru." };
    throw error;
  }
  return { ok: true };
}

/** Tujuan setelah sesi ada: beranda, layar Dikeluarkan, atau layar status di Masuk. */
export async function homeHref() {
  const user = await getCurrentUser();
  if (!user) return "/masuk";
  return destinationHref(destinationFor(user));
}

/** Masuk (AA-04). */
export async function signInAction(input: unknown): Promise<FormState> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const { email } = parsed.data;
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
  redirect(destinationHref(destination));
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/masuk");
}

export async function forgotPasswordAction(input: unknown): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
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
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  const parsed = signUpSchema.pick({ name: true }).safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });
  redirect(destinationHref(destinationFor(user)));
}

/** Akun dikeluarkan memilih lanjut sebagai Peserta. */
export async function continueAsPesertaAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  await db.membership.deleteMany({
    where: { userId: user.id, status: "REMOVED" },
  });
  redirect("/beranda");
}

/**
 * Hapus akun (AA-10). Data pribadi dihapus; acara dan penilaian tetap di organisasi.
 * Email dianonimkan agar bisa dipakai mendaftar lagi.
 */
export async function deleteAccountAction(input: {
  email: string;
  confirmed: boolean;
}): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  if (user.membership?.status !== "REMOVED")
    return {
      error: "Hapus akun hanya tersedia setelah dikeluarkan dari organisasi.",
    };
  if (input.email.trim().toLowerCase() !== user.email || !input.confirmed)
    return { fieldErrors: { email: "Email tidak cocok dengan akun ini." } };
  await db.$transaction([
    db.materialEnrollment.deleteMany({ where: { userId: user.id } }),
    db.notification.deleteMany({ where: { userId: user.id } }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.account.deleteMany({ where: { userId: user.id } }),
    db.membership.deleteMany({ where: { userId: user.id } }),
    db.user.update({
      where: { id: user.id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        email: `deleted+${user.id}@becraft.invalid`,
        name: "Akun dihapus",
        image: null,
      },
    }),
  ]);
  redirect("/akun-dihapus");
}
