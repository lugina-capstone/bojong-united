import {
  FileTextIcon,
  LinkIcon,
  TypeIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";

import type { SectionKind } from "@/lib/material-rules";

/** Ikon dan warna per jenis bagian materi (dipakai server dan client). */
export const KIND_ICON: Record<SectionKind, LucideIcon> = {
  file: FileTextIcon,
  video: VideoIcon,
  link: LinkIcon,
  text: TypeIcon,
};

export const KIND_TONE: Record<SectionKind, string> = {
  file: "bg-primary-50 text-primary-600",
  video: "bg-tone-peach-bg text-tone-peach-fg",
  link: "bg-tone-sage-bg text-tone-sage-fg",
  text: "bg-tone-lilac-bg text-tone-lilac-fg",
};
