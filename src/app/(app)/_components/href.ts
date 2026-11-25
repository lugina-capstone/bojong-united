export type SearchParams = Record<string, string | string[] | undefined>;

/** Nilai tunggal dari search param. */
export function param(params: SearchParams, key: string) {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** URL dengan search param saat ini + perubahan; nilai kosong dihapus. */
export function hrefWith(
  path: string,
  params: SearchParams,
  changes: Record<string, string | number | null>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single) query.set(key, single);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") query.delete(key);
    else query.set(key, String(value));
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

export const PAGE_SIZE = 10;

/** Jumlah per halaman dari `?per=`; nilai di luar `options` memakai `fallback`. */
export function pageSizeOf(
  params: SearchParams,
  options: readonly number[],
  fallback: number,
) {
  const size = Number.parseInt(param(params, "per"), 10);
  return options.includes(size) ? size : fallback;
}

/** Halaman aktif (≥ 1) dari `?page=`. */
export function pageOf(params: SearchParams) {
  const page = Number.parseInt(param(params, "page"), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}
