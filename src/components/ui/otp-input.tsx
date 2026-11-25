"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";

import { OTP_LENGTH } from "@/lib/otp";

function OtpSlot({ index, invalid }: { index: number; invalid?: boolean }) {
  const context = React.useContext(OTPInputContext);
  const slot = context.slots[index];
  return (
    <div
      data-active={slot?.isActive || undefined}
      data-filled={slot?.char ? true : undefined}
      className={cn(
        "relative flex h-14.5 min-w-0 flex-1 items-center justify-center rounded-lg border border-input bg-card text-stat text-foreground transition-colors data-filled:border-label data-active:border-2 data-active:border-primary-400 data-active:bg-primary-50",
        invalid &&
          "border-[1.5px] border-danger-500 data-filled:border-danger-500",
      )}
    >
      {slot?.char}
      {slot?.hasFakeCaret && (
        <span
          aria-hidden="true"
          className="h-5.5 w-0.5 animate-pulse rounded-full bg-primary-500"
        />
      )}
    </div>
  );
}

/** Input OTP 6 digit untuk verifikasi email. */
function OtpInput({
  className,
  invalid,
  ...props
}: Omit<
  React.ComponentProps<typeof OTPInput>,
  "maxLength" | "render" | "children"
> & {
  invalid?: boolean;
}) {
  return (
    <OTPInput
      maxLength={OTP_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      pushPasswordManagerStrategy="none"
      aria-invalid={invalid || undefined}
      containerClassName={cn("flex w-full gap-2.5", className)}
      {...props}
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <OtpSlot key={index} index={index} invalid={invalid} />
      ))}
    </OTPInput>
  );
}

export { OtpInput, OTP_LENGTH };
