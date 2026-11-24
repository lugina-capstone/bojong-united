import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const iconBoxVariants = cva("flex shrink-0 items-center justify-center", {
  variants: {
    tone: {
      primary: "bg-primary-50 text-primary-500",
      success: "bg-success-50 text-success-600",
      warning: "bg-warning-50 text-warning-700",
      danger: "bg-danger-50 text-danger-600",
      neutral: "bg-muted text-label",
      muted: "bg-muted text-subtle",
      blue: "bg-tone-blue-bg text-tone-blue-fg",
      peach: "bg-tone-peach-bg text-tone-peach-fg",
      sage: "bg-tone-sage-bg text-tone-sage-fg",
      lilac: "bg-tone-lilac-bg text-tone-lilac-fg",
      sand: "bg-tone-sand-bg text-tone-sand-fg",
      slate: "bg-tone-slate-bg text-tone-slate-fg",
    },
    size: {
      xs: "size-6 rounded-sm [&_svg]:size-3",
      sm: "size-8 rounded-md [&_svg]:size-4",
      md: "size-10 rounded-lg [&_svg]:size-5",
      lg: "size-12 rounded-xl [&_svg]:size-6",
      xl: "size-14 rounded-2xl [&_svg]:size-6",
    },
  },
  defaultVariants: { tone: "primary", size: "md" },
});

/** Kotak ikon berwarna untuk kartu, daftar, dan status. */
function IconBox({
  icon: Icon,
  tone,
  size,
  className,
}: VariantProps<typeof iconBoxVariants> & {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span
      data-slot="icon-box"
      className={cn(iconBoxVariants({ tone, size }), className)}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}

export { IconBox, iconBoxVariants };
