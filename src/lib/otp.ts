export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;
export const OTP_VALID_MINUTES = 10;
/** Masa berlaku tautan atur ulang kata sandi. */
export const RESET_LINK_MINUTES = 15;

/** Identifier penanda jeda kirim ulang OTP per email. */
export function otpResendKey(email: string) {
  return `otp-resend:${email}`;
}
