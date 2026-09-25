export interface ScoreRowProps {
  homeLabel: string;
  awayLabel: string;
  finished: boolean;
  homeGoals?: number | null;
  awayGoals?: number | null;
  penaltiesHomeGoals?: number | null;
  penaltiesAwayGoals?: number | null;
  homeSubLabel?: string;
  awaySubLabel?: string;
  caption?: string;
  className?: string;
}

export function ScoreRow({
  homeLabel,
  awayLabel,
  finished,
  homeGoals,
  awayGoals,
  penaltiesHomeGoals,
  penaltiesAwayGoals,
  homeSubLabel,
  awaySubLabel,
  caption,
  className = "",
}: ScoreRowProps) {
  const usesPenalties =
    finished &&
    penaltiesHomeGoals !== null &&
    penaltiesHomeGoals !== undefined &&
    penaltiesAwayGoals !== null &&
    penaltiesAwayGoals !== undefined;

  return (
    <div className={`flex w-full items-center gap-3 ${className}`}>
      <div className="min-w-0 flex-1">
        {homeSubLabel && (
          <p className="truncate text-[11px] uppercase tracking-wider text-muted/60">
            {homeSubLabel}
          </p>
        )}
        <p className="truncate font-medium text-foreground">{homeLabel}</p>
      </div>

      <div className="shrink-0 px-1 text-center">
        {finished && homeGoals != null && awayGoals != null ? (
          <>
            <p className="text-lg font-bold leading-tight tabular-nums text-primary">
              {homeGoals} - {awayGoals}
            </p>
            {usesPenalties && (
              <p className="mt-0.5 text-[11px] leading-tight text-muted">
                Penales {penaltiesHomeGoals} – {penaltiesAwayGoals}
                <span className="block font-medium text-primary">Ganó por penales</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted">VS</p>
        )}
        {caption && (
          <p className="text-[11px] uppercase tracking-wider text-muted/60">{caption}</p>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {awaySubLabel && (
          <p className="truncate text-right text-[11px] uppercase tracking-wider text-muted/60">
            {awaySubLabel}
          </p>
        )}
        <p className="truncate text-right font-medium text-foreground">{awayLabel}</p>
      </div>
    </div>
  );
}