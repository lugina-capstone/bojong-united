import { cn } from "cn";

/** Bilah filter: kolom cari melebar + Select di kanan; menumpuk di mobile. */
function FilterBar({
  search,
  children,
  card,
  className,
}: {
  search?: React.ReactNode;
  children?: React.ReactNode;
  /** Bungkus dalam kartu (Daftar Acara Guru). */
  card?: boolean;
  className?: string;
}) {
  return (
    <div
      data-slot="filter-bar"
      role="search"
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:gap-3.5",
        card && "rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      {search && <div className="min-w-0 flex-1">{search}</div>}
      {children && (
        <div className="grid grid-cols-2 gap-3 md:flex md:shrink-0 [&>*]:md:w-45">
          {children}
        </div>
      )}
    </div>
  );
}

export { FilterBar };
