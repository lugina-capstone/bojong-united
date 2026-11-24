import { cn } from "@/lib/utils";

/** Bilah aksi wizard sticky di bawah: Kembali, info langkah, Simpan draf, Lanjut. */
function WizardActionBar({
  step,
  total,
  back,
  children,
  className,
}: {
  step: number;
  total: number;
  back?: React.ReactNode;
  /** Aksi di kanan, mis. Simpan draf + Lanjut. */
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="wizard-action-bar"
      className={cn(
        "sticky bottom-0 z-20 flex flex-wrap items-center gap-3 border-t border-border bg-card px-4 py-4 shadow-atas sm:px-8 lg:px-12",
        className,
      )}
    >
      {back}
      <p className="min-w-0 flex-1 text-small text-subtle">
        Langkah {step} dari {total}
      </p>
      <div className="flex w-full gap-3 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
        {children}
      </div>
    </div>
  );
}

export { WizardActionBar };
