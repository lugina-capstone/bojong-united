export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

/** Data user setelah satu kali kata sandi salah. Percobaan ke-5 mengunci akun 15 menit dan mereset hitungan. */
export function nextLoginFailure(failedLoginCount: number, now: Date) {
  const count = failedLoginCount + 1;
  if (count >= MAX_FAILED_LOGINS) {
    return {
      failedLoginCount: 0,
      lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60 * 1000),
    };
  }
  return { failedLoginCount: count, lockedUntil: null };
}
