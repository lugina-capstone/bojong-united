import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  InfoIcon,
  type LucideIcon,
} from "lucide-react";

const alertVariants = cva(
  "flex w-full items-start gap-2.5 rounded-lg border p-3.5 [&>svg]:mt-px [&>svg]:size-4.5 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        info: "border-primary-200 bg-primary-50 text-primary-700",
        danger: "border-danger-200 bg-danger-50 text-danger-700",
        warning: "border-warning-200 bg-warning-50 text-warning-700",
        success: "border-success-200 bg-success-50 text-success-700",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const ICONS: Record<
  NonNullable<VariantProps<typeof alertVariants>["tone"]>,
  LucideIcon
> = {
  info: InfoIcon,
  danger: CircleXIcon,
  warning: ClockIcon,
  success: CircleCheckIcon,
};

/** Alert di dalam halaman: Info/Bahaya/Warning/Sukses. */
function Alert({
  className,
  tone = "info",
  icon,
  title,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof alertVariants> & {
    icon?: LucideIcon;
    title?: React.ReactNode;
  }) {
  const Icon = icon ?? ICONS[tone ?? "info"];
  return (
    <div
      data-slot="alert"
      role={tone === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="text-body-strong">{title}</p>}
        {children && <div className="text-small">{children}</div>}
      </div>
    </div>
  );
}

export { Alert, alertVariants };
