import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:shadow-focus-ring disabled:pointer-events-none aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-inverse hover:bg-primary-600 active:bg-primary-700 disabled:opacity-45 data-[loading]:bg-primary-600",
        secondary:
          "border-input bg-card text-foreground hover:bg-muted active:border-primary-200 active:bg-border disabled:border-border disabled:bg-muted disabled:text-subtle data-[loading]:bg-muted",
        danger:
          "bg-danger-500 text-inverse hover:bg-danger-700 active:bg-danger-700 disabled:opacity-45 data-[loading]:bg-danger-700",
        ghost:
          "text-primary-500 hover:bg-primary-50 active:bg-primary-100 disabled:text-subtle data-[loading]:bg-primary-50",
        link: "h-auto! px-0! text-primary-500 underline-offset-4 hover:underline",
      },
      size: {
        lg: "h-11 px-4.5 text-button [&_svg:not([class*='size-'])]:size-4",
        md: "h-10 px-4 text-button [&_svg:not([class*='size-'])]:size-4",
        sm: "h-8.5 px-3 text-button-s [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Menampilkan spinner dan menonaktifkan tombol selama proses. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader2Icon aria-hidden="true" className="animate-spin" />}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants, type ButtonProps };
