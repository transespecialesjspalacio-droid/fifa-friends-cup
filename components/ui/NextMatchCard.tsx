export interface NextMatchCardProps {
  className?: string;
  status?: "upcoming" | "live" | "completed";
  label?: string;
  home?: string | null;
  away?: string | null;
  note?: string;
}

export function NextMatchCard({
  className,
  status = "upcoming",
  label,
  home,
  away,
  note,
}: NextMatchCardProps) {
  const statusClasses = {
    upcoming: "border-primary/30 text-primary",
    live: "border-success/30 text-success",
    completed: "border-muted/30 text-muted",
  };

  const homeLabel = home ?? "Por definir";
  const awayLabel = away ?? "Por definir";

  return (
    <div className={`p-3 rounded-2xl border border-surface/30 ${statusClasses[status]} ${className} transition-colors`}>
      <h3 className="text-sm font-medium text-foreground mb-1">PRÓXIMO PARTIDO</h3>
      {label && (
        <p className="text-xs text-muted/60 mb-1">{label}</p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <p className="text-base sm:text-lg font-bold text-foreground">{homeLabel}</p>
        <p className="text-base sm:text-lg font-bold text-primary">VS</p>
        <p className="text-base sm:text-lg font-bold text-foreground">{awayLabel}</p>
      </div>
      <p className="text-xs text-muted/60 mt-1">{note ?? "Fecha y hora"}</p>
    </div>
  );
}