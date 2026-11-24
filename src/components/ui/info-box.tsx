import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";

/** Kotak info aturan penilaian/alur untuk Guru atau Peserta. */
function InfoBox({
  title,
  items,
  className,
}: {
  title: string;
  items: { title: string; description: string }[];
  className?: string;
}) {
  return (
    <aside
      data-slot="info-box"
      className={cn(
        "flex w-full items-start gap-3 rounded-xl bg-primary-50 p-4",
        className,
      )}
    >
      <InfoIcon
        aria-hidden="true"
        className="mt-px size-4.5 shrink-0 text-tone-navy-fg"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <p className="text-body-strong text-tone-navy-fg">{title}</p>
        <dl className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col gap-0.5 text-small">
              <dt className="font-semibold text-tone-navy-fg">{item.title}</dt>
              <dd className="text-muted-foreground">{item.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

export { InfoBox };
