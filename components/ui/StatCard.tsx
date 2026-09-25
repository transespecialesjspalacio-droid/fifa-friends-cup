export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  variant = "default",
  className,
}: StatCardProps) {
  const variantClasses = {
    default: "text-muted",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
  };

  return (
    <div className={`p-4 rounded-xl border border-surface/30 ${variantClasses[variant]} ${className}`}>
      <p className="text-sm uppercase tracking-wider {variantClasses[variant]} mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground mb-1">{typeof value === "number" ? value.toString() : value}</p>
      {subtitle && <p className="text-xs text-muted/60">{subtitle}</p>}
    </div>
  );
}