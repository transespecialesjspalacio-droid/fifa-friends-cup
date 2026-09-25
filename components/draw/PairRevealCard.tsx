import type { DrawableParticipant } from "@/lib/services/draw";

export interface PairRevealCardProps {
  order: number;
  participant1: DrawableParticipant;
  participant2: DrawableParticipant;
  revealed: boolean;
}

function nameOrHidden(participant: DrawableParticipant, revealed: boolean): string {
  if (!revealed) return "---";
  return participant.nickname
    ? `${participant.name} (${participant.nickname})`
    : participant.name;
}

export function PairRevealCard({
  order,
  participant1,
  participant2,
  revealed,
}: PairRevealCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-surface/50 bg-surface p-4 transition-opacity ${
        revealed ? "" : "opacity-40"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {order}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate font-medium text-foreground">
          {nameOrHidden(participant1, revealed)}
        </span>
        <span className="text-muted">vs</span>
        <span className="truncate text-right font-medium text-foreground">
          {nameOrHidden(participant2, revealed)}
        </span>
      </div>
    </div>
  );
}