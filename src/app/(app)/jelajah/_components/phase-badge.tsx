import { Badge } from "@/components/ui/badge";
import type { EventPhase } from "@/lib/event-rules";

const PHASE: Partial<
  Record<
    EventPhase,
    { label: string; tone: "success" | "warning" | "neutral" | "primary" }
  >
> = {
  upcoming: { label: "Segera dimulai", tone: "warning" },
  ongoing: { label: "Berlangsung", tone: "success" },
  finished: { label: "Selesai", tone: "neutral" },
  archived: { label: "Diarsipkan", tone: "neutral" },
};

/** Status acara dari sisi Peserta. */
function PhaseBadge({ phase }: { phase: EventPhase }) {
  const item = PHASE[phase] ?? PHASE.finished!;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export { PhaseBadge };
