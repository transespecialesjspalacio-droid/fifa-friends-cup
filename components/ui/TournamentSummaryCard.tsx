import { cn } from "@/lib/utils";

export interface TournamentSummaryCardProps {
  title: string;
  count: number;
  label: string;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  className?: string;
}

export function TournamentSummaryCard({
  title,
  count,
  label,
  variant = "default",
  className,
}: TournamentSummaryCardProps) {
  return (
    <div className={`p-3 rounded-xl border border-surface/30 ${cn("flex flex-col items-start", variantClasses[variant])} ${className}`}>
      <p className="text-xs uppercase tracking-wider text-muted/60 mb-0.5">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{typeof count === "number" ? count.toLocaleString() : count}</p>
      <p className="text-xs text-muted/60">{label}</p>
    </div>
  );
}

const variantClasses = {
  default: "text-muted",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};