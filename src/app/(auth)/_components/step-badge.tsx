function StepBadge({
  label,
  step,
  total,
}: {
  label?: string;
  step: number;
  total: number;
}) {
  return (
    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-caption-strong text-primary-500">
      {label && `${label} · `}Langkah {step} dari {total}
    </span>
  );
}

export { StepBadge };
