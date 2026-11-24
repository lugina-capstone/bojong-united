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
        "flex max-w-full gap-6 overflow-x-auto border-b border-border px-4 sm:px-5",
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
              "group/tab -mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 py-3 text-body-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:shadow-focus-ring",
              isActive &&
                "border-primary-500 text-body-strong text-primary-500",
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
