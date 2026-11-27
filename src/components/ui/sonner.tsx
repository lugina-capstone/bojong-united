"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toast pojok kanan atas, tertutup otomatis setelah 3 detik (README §6). */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      duration={3000}
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success-500" />,
        info: <InfoIcon className="size-4 text-primary-500" />,
        warning: <TriangleAlertIcon className="size-4 text-warning-500" />,
        error: <OctagonXIcon className="size-4 text-danger-500" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-overlay)",
          "--normal-text": "var(--color-inverse)",
          "--normal-border": "var(--color-overlay)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-md text-small",
          title: "text-small-strong",
          description: "text-small text-input!",
          closeButton:
            "!border-border/20 !bg-overlay !text-input hover:!text-inverse",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
