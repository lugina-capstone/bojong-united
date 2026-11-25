const TIME_ZONE = "Asia/Jakarta";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const timeFormat = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const longDateFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/** "5 Jan 2025" */
export function formatDate(date: Date) {
  return dateFormat.format(date);
}

/** "21.40 WIB" */
export function formatTime(date: Date) {
  return `${timeFormat.format(date)} WIB`;
}

/** "5 Jan 2025, 21.40" */
export function formatDateTime(date: Date) {
  return `${dateFormat.format(date)}, ${timeFormat.format(date)}`;
}

/** "Senin, 6 Januari 2025" */
export function formatLongDate(date: Date) {
  return longDateFormat.format(date);
}

/** "2 menit lalu", "Kemarin, 14.20", lalu tanggal. */
export function formatRelative(date: Date, now = new Date()) {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  if (hours < 48) return `Kemarin, ${timeFormat.format(date)}`;
  return formatDate(date);
}

/** Jumlah hari kerja (Senin–Jumat) penuh yang sudah lewat sejak `date`. */
export function workingDaysSince(date: Date, now = new Date()) {
  let days = 0;
  const cursor = new Date(date);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= now) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Sapaan sesuai jam di WIB. */
export function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: TIME_ZONE,
    }).format(now),
  );
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

export function daysAgo(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

/** Date dari nilai `datetime-local` yang diisi dalam WIB. */
export function parseWibInput(value: string) {
  return new Date(`${value}:00+07:00`);
}

/** Nilai 0–100 dibulatkan 2 desimal (mis. 55.00000000000001 → "55"). */
export function formatScore(value: number) {
  return String(Math.round(value * 100) / 100);
}

/** Hitung mundur "mm:ss", mis. 42 → "00:42". */
export function formatCountdown(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
