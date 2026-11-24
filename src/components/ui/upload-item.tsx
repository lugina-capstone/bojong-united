import { cn } from "@/lib/utils";
import { FileIcon, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/** Batas unggah per berkas; lebih dari ini peserta diarahkan memakai tautan. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Item unggah: progres 0–100% atau gagal dengan pesan. */
function UploadItem({
  name,
  size,
  progress,
  error,
  icon: Icon = FileIcon,
  action,
  className,
}: {
  name: string;
  size: number;
  progress: number;
  error?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  const done = !error && progress >= 100;
  return (
    <div
      data-slot="upload-item"
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5",
        error && "border-danger-200 bg-danger-50",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-tone-peach-bg text-tone-peach-fg",
            error && "bg-card text-danger-500",
          )}
        >
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-body-strong text-foreground">{name}</p>
          <p className="text-small text-muted-foreground">
            {formatBytes(size)}
          </p>
        </div>
        {error ? (
          <Badge tone="danger">Gagal</Badge>
        ) : done ? (
          <Badge tone="success">Selesai</Badge>
        ) : (
          <span className="text-small-strong text-primary-500">
            {Math.round(progress)}%
          </span>
        )}
        {action}
      </div>
      {!error && !done && (
        <Progress value={progress} label={`Mengunggah ${name}`} />
      )}
      {error && <p className="text-small text-danger-500">{error}</p>}
    </div>
  );
}

export { UploadItem, MAX_UPLOAD_BYTES, formatBytes };
