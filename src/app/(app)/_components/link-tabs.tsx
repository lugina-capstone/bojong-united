import Link from "next/link";

import { cn } from "@/lib/utils";

/** Tab bergaris berbasis URL, dengan jumlah opsional. */
function LinkTabs({
  tabs,
  active,
  label,
  className,
}: {
  tabs: { value: string; label: string; count?: number; href: string }[];
  active: string;
  label: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "flex max-w-full gap-6 overflow-x-auto overflow-y-hidden border-b border-border px-4 sm:px-5",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group/tab relative inline-flex items-center gap-1.5 px-1 py-3 text-body-medium whitespace-nowrap text-muted-foreground transition-colors outline-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent hover:text-foreground focus-visible:shadow-focus-ring",
              isActive &&
                "text-body-strong text-primary-500 after:bg-primary-500",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full bg-muted px-2.25 py-0.75 text-caption-strong text-label",
                  isActive && "bg-primary-50 text-primary-600",
                )}
              >
                {tab.count.toLocaleString("id-ID")}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export { LinkTabs };
