import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const skeletonVariants = cva("animate-skeleton motion-reduce:animate-none", {
  variants: {
    shape: {
      line: "h-3 rounded-full",
      block: "h-30 rounded-xl",
      circle: "size-10 rounded-full",
    },
  },
  defaultVariants: { shape: "line" },
});

/** Placeholder memuat: Baris/Blok/Lingkaran, berdenyut antara fase A dan B. */
function Skeleton({
  className,
  shape,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  );
}

export { Skeleton };
