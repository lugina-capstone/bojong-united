import type { ReactNode } from "react";

import { isWebUrl } from "@/lib/web-url";

/** Tautan luar; nilai lama yang bukan http/https ditampilkan sebagai teks biasa. */
export function WebLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) {
  if (!isWebUrl(href))
    return (
      <span className="truncate text-small text-muted-foreground">{href}</span>
    );
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children ?? href}
    </a>
  );
}
