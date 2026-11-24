import { cn } from "cn";

/** Kepala halaman: judul, deskripsi, eyebrow opsional, dan aksi di kanan. */
function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  hero,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  /** Judul besar 36 px untuk halaman wizard pembuka. */
  hero?: boolean;
  className?: string;
}) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {eyebrow && <p className="text-overline text-subtle">{eyebrow}</p>}
        <h1
          className={cn("text-foreground", hero ? "text-hero" : "text-display")}
        >
          {title}
        </h1>
        {description && (
          <p className="text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

export { PageHeader };
