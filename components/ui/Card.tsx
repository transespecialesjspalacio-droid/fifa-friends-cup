export interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-surface/30 bg-surface/80 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-surface/50 ${className}`}
    >
      {children}
    </div>
  );
}