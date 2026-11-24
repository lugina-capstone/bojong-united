/* eslint-disable @next/next/no-img-element -- logo berasal dari URL sementara storage. */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const orgLogoVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden bg-primary-100 font-semibold text-primary-700",
  {
    variants: {
      size: {
        sm: "size-5 rounded-xs text-[8px]",
        md: "size-11 rounded-lg text-[15px]",
        lg: "size-24 rounded-3xl text-[32px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/** Logo organisasi (S 20 / M 44 / L 96). Tanpa logo, tampil inisial nama. */
function OrgLogo({
  name,
  src,
  size,
  className,
}: VariantProps<typeof orgLogoVariants> & {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <span
      data-slot="org-logo"
      className={cn(orgLogoVariants({ size }), className)}
    >
      {src ? (
        <img
          src={src}
          alt={`Logo ${name}`}
          className="size-full object-cover"
        />
      ) : (
        <span aria-label={name}>{initialsOf(name)}</span>
      )}
    </span>
  );
}

export { OrgLogo, initialsOf };
