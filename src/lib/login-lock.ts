export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

/** Akun dikunci saat hitungan gagal mencapai batas. */
export function lockAfterFailure(failedLoginCount: number, now: Date) {
  if (failedLoginCount < MAX_FAILED_LOGINS) return null;
  return new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
}
