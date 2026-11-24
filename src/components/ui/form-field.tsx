import * as React from "react";
import { cn } from "cn";

/** Label + kontrol + teks bantuan/error. Kontrol diberi `id`, `aria-invalid`, dan `aria-describedby` sendiri. */
function FormField({
  id,
  label,
  description,
  error,
  action,
  required,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  /** Elemen di kanan label, mis. tautan "Lupa kata sandi?". */
  action?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="form-field"
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-small-strong text-label">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger-500">
              *
            </span>
          )}
        </label>
        {action && (
          <div className="text-small-medium text-primary-500">{action}</div>
        )}
      </div>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-caption text-danger-500"
        >
          {error}
        </p>
      ) : (
        description && (
          <p
            id={`${id}-description`}
            className="text-caption text-muted-foreground"
          >
            {description}
          </p>
        )
      )}
    </div>
  );
}

/** Nilai `aria-describedby` yang cocok dengan FormField. */
function fieldDescribedBy(
  id: string,
  { error, description }: { error?: unknown; description?: unknown },
) {
  if (error) return `${id}-error`;
  if (description) return `${id}-description`;
  return undefined;
}

export { FormField, fieldDescribedBy };
