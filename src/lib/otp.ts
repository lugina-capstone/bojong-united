export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;

/** Identifier penanda jeda kirim ulang OTP per email. */
export function otpResendKey(email: string) {
  return `otp-resend:${email}`;
}
