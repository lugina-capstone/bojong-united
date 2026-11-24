import { cn } from "@/lib/utils";
import {
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  type LucideIcon,
} from "lucide-react";

import { IconBox } from "@/components/ui/icon-box";

const KIND_ICON: Record<"file" | "image" | "link", LucideIcon> = {
  file: FileTextIcon,
  image: ImageIcon,
  link: LinkIcon,
};

/** Baris berkas terlampir: ikon jenis, nama, keterangan, dan aksi unduh/lihat. */
function FileItem({
  name,
  meta,
  kind = "file",
  action,
  className,
}: {
  name: string;
  meta?: string;
  kind?: keyof typeof KIND_ICON;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="file-item"
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-3",
        className,
      )}
    >
      <IconBox
        icon={KIND_ICON[kind]}
        tone={kind === "link" ? "blue" : "peach"}
        size="sm"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-small-medium text-label">{name}</p>
        {meta && <p className="truncate text-caption text-subtle">{meta}</p>}
      </div>
      {action}
    </div>
  );
}

export { FileItem };
