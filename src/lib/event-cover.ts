import type { CoverTone } from "@/components/ui/event-card";

const TONES: CoverTone[] = ["blue", "sage", "peach", "slate", "lilac", "sand"];

/** Warna sampul acara yang stabil per id. */
export function coverToneFor(id: string): CoverTone {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length]!;
}

export const COVER_CLASS: Record<CoverTone, string> = {
  blue: "bg-primary-100 text-primary-600",
  peach: "bg-tone-peach-bg text-tone-peach-fg",
  sage: "bg-tone-sage-bg text-tone-sage-fg",
  lilac: "bg-tone-lilac-bg text-tone-lilac-fg",
  sand: "bg-tone-sand-bg text-tone-sand-fg",
  slate: "bg-tone-slate-bg text-tone-slate-fg",
};
