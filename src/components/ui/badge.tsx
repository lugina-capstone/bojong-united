import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center rounded-full whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        primary: "bg-primary-50 text-primary-600",
        neutral: "bg-muted text-label",
        success: "bg-success-50 text-success-700",
        warning: "bg-warning-50 text-warning-700",
        danger: "bg-danger-50 text-danger-700",
      },
      size: {
        md: "gap-1 px-2 py-0.5 text-caption-strong [&>svg]:size-3",
        sm: "gap-0.75 px-1.5 py-px text-caption-s [&>svg]:size-2.5",
      },
    },
    defaultVariants: {
      tone: "primary",
      size: "md",
    },
  },
);

function Badge({
  className,
  tone,
  size,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ tone, size }), className) },
      props,
    ),
    render,
    state: { slot: "badge", tone },
  });
}

export { Badge, badgeVariants };
