export interface RevealItem {
  order: number;
}

export interface DrawStageProps<T extends RevealItem> {
  steps: T[];
  revealedCount: number;
  renderStep: (step: T, revealed: boolean) => React.ReactNode;
  emptyMessage: string;
}

export function DrawStage<T extends RevealItem>({
  steps,
  revealedCount,
  renderStep,
  emptyMessage,
}: DrawStageProps<T>) {
  if (steps.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-surface/50 bg-surface/30 px-4 py-8 text-center text-sm text-muted/60">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => {
        const revealed = step.order <= revealedCount;
        return <div key={step.order}>{renderStep(step, revealed)}</div>;
      })}
    </div>
  );
}