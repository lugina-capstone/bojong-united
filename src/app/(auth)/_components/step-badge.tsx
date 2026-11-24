function StepBadge({ step, total }: { step: number; total: number }) {
  return (
    <span className="text-caption-strong text-subtle">
      Langkah {step} dari {total}
    </span>
  );
}

export { StepBadge };
