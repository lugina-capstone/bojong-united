/** Hanya tautan http/https yang aman dijadikan tautan yang bisa diklik. */
export function isWebUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const WEB_URL_ERROR = "Tautan harus diawali http:// atau https://";
