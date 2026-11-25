/** Kriteria yang ditampilkan di indikator kekuatan kata sandi. */
export function passwordChecks(password: string) {
  return [
    { label: "Min. 8 karakter", met: password.length >= 8 },
    {
      label: "Huruf besar & kecil",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: "Angka", met: /\d/.test(password) },
  ];
}

/** 0 (kosong) sampai 4 (Kuat): satu tingkat per kriteria, ditambah satu untuk 12 karakter atau simbol. */
export function passwordStrength(password: string) {
  if (!password) return 0;
  const met = passwordChecks(password).filter((check) => check.met).length;
  const bonus = password.length >= 12 || /[^A-Za-z0-9]/.test(password) ? 1 : 0;
  return Math.max(1, Math.min(4, met + bonus));
}
