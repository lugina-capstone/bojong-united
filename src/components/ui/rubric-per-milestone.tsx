import { RubricCriterion } from "@/components/ui/rubric";
import { cn } from "@/lib/utils";

/** Rubrik yang dipasang ke satu milestone: nama milestone, nama rubrik, dan daftar kriteria. */
function RubricPerMilestone({
  milestone,
  rubric,
  criteria,
  action,
  className,
}: {
  milestone: string;
  rubric: string;
  criteria: string[];
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      data-slot="rubric-per-milestone"
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-overline text-subtle">{milestone}</p>
          <h3 className="text-body-strong text-foreground">{rubric}</h3>
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-3">
        {criteria.map((name, index) => (
          <RubricCriterion key={name} order={index + 1} name={name} />
        ))}
      </div>
    </section>
  );
}

export { RubricPerMilestone };
