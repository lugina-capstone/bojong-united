import { cn } from "@/lib/utils";

/** Kartu bagian halaman: judul, deskripsi, aksi kanan, lalu isi. */
function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-col gap-3 px-4 pt-4.5 pb-3 sm:flex-row sm:items-start sm:px-5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {title && <h2 className="text-h3 text-foreground">{title}</h2>}
            {description && (
              <p className="text-small text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("flex min-w-0 flex-col", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export { SectionCard };
