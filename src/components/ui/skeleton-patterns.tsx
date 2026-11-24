import { cn } from "cn";

import { Skeleton } from "@/components/ui/skeleton";

/** Kepala halaman: overline, judul, deskripsi, dan tombol aksi. */
function SkeletonPageHeader({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2.5">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-6 w-60 max-w-full" />
        <Skeleton className="h-3 w-96 max-w-full" />
      </div>
      {action && <Skeleton shape="block" className="h-10 w-36" />}
    </div>
  );
}

/** Baris kartu statistik (ikon + label + angka). */
function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4.5"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton shape="block" className="size-9" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Kolom cari + beberapa select. */
function SkeletonFilterBar({ selects = 3 }: { selects?: number }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <Skeleton shape="block" className="h-11 flex-1" />
      <div className="grid grid-cols-2 gap-3 md:flex">
        {Array.from({ length: selects }, (_, i) => (
          <Skeleton key={i} shape="block" className="h-11 md:w-45" />
        ))}
      </div>
    </div>
  );
}

/** Tab garis dengan jumlah. */
function SkeletonTabs({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-6 border-b border-border pb-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton shape="block" className="h-5.5 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Grid kartu acara/materi. */
function SkeletonCardGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
        >
          <Skeleton shape="block" className="h-34 rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2">
              <Skeleton shape="block" className="size-5.5" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between pt-1">
              <Skeleton shape="block" className="h-6 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tabel dengan kepala dan baris pengguna. */
function SkeletonTable({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex h-11 items-center gap-6 border-b border-border bg-background px-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton
            key={i}
            className={cn("h-3", i === 0 ? "w-40" : "hidden w-20 md:block")}
          />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="flex items-center gap-6 border-b border-border px-4 py-3 last:border-0"
        >
          <div className="flex flex-1 items-center gap-2.5 md:flex-none">
            <Skeleton shape="circle" className="size-8" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-40" />
            </div>
          </div>
          {Array.from({ length: columns - 1 }, (_, c) => (
            <Skeleton key={c} className="hidden h-3 w-20 md:block" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Beranda: sapaan, ringkasan, dan kartu (Peserta, Guru, Admin Organisasi). */
function SkeletonDashboard() {
  return (
    <div aria-busy="true" aria-label="Memuat" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <SkeletonStatGrid count={3} />
      <SkeletonCardGrid count={3} />
    </div>
  );
}

/** Jelajah acara/materi: pengantar, filter, tab, dan grid kartu. */
function SkeletonExplore() {
  return (
    <div aria-busy="true" aria-label="Memuat" className="flex flex-col gap-6">
      <SkeletonPageHeader action={false} />
      <SkeletonFilterBar />
      <SkeletonTabs />
      <SkeletonCardGrid />
    </div>
  );
}

/** Daftar kelola (Materi, Tugas & Penilaian, Anggota, Antrean): statistik, tab, filter, tabel. */
function SkeletonListPage({ stats = 4 }: { stats?: number }) {
  return (
    <div aria-busy="true" aria-label="Memuat" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      {stats > 0 && <SkeletonStatGrid count={stats} />}
      <SkeletonTabs />
      <SkeletonFilterBar selects={2} />
      <SkeletonTable />
    </div>
  );
}

export {
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonFilterBar,
  SkeletonTabs,
  SkeletonCardGrid,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonExplore,
  SkeletonListPage,
};
