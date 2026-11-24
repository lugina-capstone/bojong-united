import { cn } from "cn";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IconButtonProps = Omit<ButtonProps, "aria-label" | "variant"> & {
  /** Wajib: dibacakan pembaca layar dan tampil sebagai tooltip. */
  label: string;
  tooltipSide?: "top" | "bottom";
};

/** Tombol ikon 36 px dengan tooltip saat hover/focus. */
function IconButton({
  label,
  tooltipSide = "top",
  className,
  size = "icon",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size={size}
            aria-label={label}
            className={cn("text-label disabled:opacity-40", className)}
            {...props}
          />
        }
      />
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}

export { IconButton };
