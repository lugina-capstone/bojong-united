import { cn } from "@/lib/utils";

/** Daftar label–nilai dengan garis pemisah (Data organisasi, Info organisasi). */
function InfoRows({
  rows,
  className,
}: {
  rows: { label: string; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn("flex flex-col", className)}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-1 gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-4"
        >
          <dt className="text-small text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 text-body text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Butir dampak di dialog konfirmasi (ikon berwarna + teks). */
function ConsequenceList({
  items,
}: {
  items: {
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    tone: "success" | "danger" | "info" | "warning";
    text: React.ReactNode;
  }[];
}) {
  const tones = {
    success: "text-success-600",
    danger: "text-danger-500",
    info: "text-primary-500",
    warning: "text-warning-700",
  };
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-small text-label">
          <item.icon
            aria-hidden
            className={cn("mt-0.5 size-4 shrink-0", tones[item.tone])}
          />
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

export { ConsequenceList, InfoRows };
