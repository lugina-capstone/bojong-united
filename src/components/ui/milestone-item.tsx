import { cn } from "cn";
import { CheckIcon, LockKeyholeIcon } from "lucide-react";

type MilestoneState = "done" | "active" | "locked";

/** Item milestone di daftar samping Ruang Kerja Acara. */
function MilestoneItem({
  order,
  title,
  status,
  state,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  order: number;
  title: string;
  status: string;
  state: MilestoneState;
}) {
  return (
    <button
      type="button"
      data-state={state}
      aria-current={state === "active" ? "step" : undefined}
      disabled={state === "locked"}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-transparent p-2.5 text-left transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring disabled:cursor-not-allowed disabled:hover:bg-transparent data-[state=active]:border-primary-200 data-[state=active]:bg-primary-50",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex size-6.5 shrink-0 items-center justify-center rounded-md text-caption-strong",
          state === "active" && "bg-primary-500 text-inverse",
          state === "done" && "bg-success-500 text-inverse",
          state === "locked" && "bg-muted text-subtle",
        )}
      >
        {state === "done" ? (
          <CheckIcon aria-hidden="true" className="size-3.5" />
        ) : state === "locked" ? (
          <LockKeyholeIcon aria-hidden="true" className="size-3.5" />
        ) : (
          order
        )}
      </span>
      <span
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5 text-caption",
          state === "locked" ? "text-subtle" : "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "truncate font-semibold",
            state === "active"
              ? "text-primary-500"
              : state === "done" && "text-foreground",
          )}
        >
          {title}
        </span>
        <span className="truncate">{status}</span>
      </span>
    </button>
  );
}

export { MilestoneItem, type MilestoneState };
