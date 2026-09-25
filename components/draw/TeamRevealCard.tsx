import type { DrawableTeam, PairStep } from "@/lib/services/draw";

export interface TeamRevealCardProps {
  pair: PairStep;
  team: DrawableTeam;
  revealed: boolean;
}

function pairLabel(pair: PairStep): string {
  return `${pair.participant1.name} y ${pair.participant2.name}`;
}

export function TeamRevealCard({ pair, team, revealed }: TeamRevealCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-surface/50 bg-surface p-4 transition-opacity ${
        revealed ? "" : "opacity-40"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {pair.order}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs text-muted">{revealed ? pairLabel(pair) : "---"}</span>
        <span className="truncate font-medium text-foreground">
          {revealed ? team.name : "---"}
        </span>
      </div>
    </div>
  );
}